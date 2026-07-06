// IG 오가닉(비광고) 수집 — 워치리스트(등록 클리닉 프로필) + 해시태그 발굴
//
// 광고 라이브러리(apify.ts)는 "현재 유료 광고를 집행 중"인 곳만 잡는다. 한국 피부과
// 마케팅 대부분은 인스타 자연 게시물(피드·릴스)에서 일어나므로, 그 게시물 자체를
// 콘텐츠 카드(kind:"organic")로 수집해 광고 레이더 → 마케팅 레이더로 확장한다.
//
// 비용 제어: instagram-scraper 액터를 2회만 실행(워치리스트 1 + 해시태그 1)해 호출을
// 최소화하고, 결과는 TTL 캐시(기본 7일). 캡(프로필/게시물/해시태그 수)으로 과금 상한.
//
// 환경변수:
//   APIFY_TOKEN                (필수) 없으면 null 반환 → 오가닉 비활성.
//   ORGANIC_ENABLED            (선택) "0"이면 오가닉 수집 끔(기본 켜짐).
//   ORGANIC_PROFILE_CAP        (선택) 워치리스트 프로필 상한(기본 80).
//   ORGANIC_POSTS_PER_PROFILE  (선택) 프로필당 최근 게시물 수(기본 6).
//   ORGANIC_HASHTAG_CAP        (선택) 검색 해시태그 수 상한(기본 12).
//   ORGANIC_POSTS_PER_TAG      (선택) 해시태그당 게시물 수(기본 20).
//   ORGANIC_TTL_SECONDS        (선택) 캐시 TTL(초, 기본 604800=7일).
//   ORGANIC_HASHTAGS           (선택) 쉼표구분 커스텀 해시태그(#·공백 제거 자동). 주면 내장 목록 대체.

import { Ad, Area } from "./ads";
import { classifyTreatment } from "./treatments";
import { KNOWN_CLINICS, findClinicByHandle, classifyAdvertiser, hasClinicSignal } from "./clinics";
import { hasClinicVerifyKeys, verifyAdvertisers } from "./clinicVerify";
import { readApprovedClinics, readAdvTypeOverrides, AdvTypeOverrides } from "./snapshot";
import { areaFromText } from "./adQueries";
import {
  inferTreatment,
  inferStyle,
  inferLang,
  extractHashtags,
  buildHeadline,
  clip,
  TAGS_BY_TREATMENT,
  PALETTE_BY_TREATMENT,
} from "./apify";

// ---------- 발굴용 해시태그 (지역 권역 + 일본인 일반) ----------
const AREA_HASHTAGS: Record<Area, string[]> = {
  강남: ["강남피부과", "압구정피부과", "신사동피부과", "江南皮膚科", "狎鴎亭皮膚科"],
  명동: ["명동피부과", "을지로피부과", "明洞皮膚科", "明洞美容皮膚科"],
  홍대: ["홍대피부과", "합정피부과", "연남동피부과", "弘大皮膚科", "ホンデ皮膚科"],
};
const GENERAL_HASHTAGS = ["韓国皮膚科", "韓国美容医療", "韓国美容クリニック"];

function num(env: string | undefined, def: number, min = 1): number {
  return Math.max(min, Number(env) || def);
}

// 게시물 최신성 상한(일). 이보다 오래된 게시물은 수집하지 않는다 — 최신 트렌드만.
// 서버단(actor onlyPostsNewerThan)으로 애초에 안 받아 예산 낭비를 막고, 클라이언트에서 한 번 더 컷.
// 환경변수 ORGANIC_MAX_AGE_DAYS 로 조정 가능(기본 15).
function organicMaxAgeDays(): number {
  return num(process.env.ORGANIC_MAX_AGE_DAYS, 15, 1);
}

/** 검색할 해시태그 목록 (지역 힌트 포함). ORGANIC_HASHTAGS 로 덮어쓸 수 있음. */
function hashtagTargets(): { tag: string; area?: Area }[] {
  const custom = process.env.ORGANIC_HASHTAGS?.trim();
  if (custom) {
    return custom
      .split(",")
      .map((t) => t.replace(/^#/, "").replace(/\s+/g, "").trim())
      .filter(Boolean)
      .map((tag) => ({ tag }));
  }
  // 지역 라운드로빈 — 캡이 낮아도 강남/명동/홍대가 한 개씩 번갈아 들어오게 한다
  // (순차로 넣으면 앞쪽 지역만 캡에 걸려 통과해 지역 편향이 생김)
  const out: { tag: string; area?: Area }[] = [];
  const areas = Object.keys(AREA_HASHTAGS) as Area[];
  const maxLen = Math.max(0, ...areas.map((a) => AREA_HASHTAGS[a].length));
  for (let i = 0; i < maxLen; i++) {
    for (const area of areas) {
      const tag = AREA_HASHTAGS[area][i];
      if (tag) out.push({ tag, area });
    }
  }
  GENERAL_HASHTAGS.forEach((tag) => out.push({ tag }));
  return out;
}

// ---------- instagram-scraper 결과 항목 ----------
interface IgPost {
  ownerUsername?: string;
  ownerFullName?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  videoPlayCount?: number;
  timestamp?: string;
  url?: string;
  displayUrl?: string;
  type?: string;
}

function postId(p: IgPost): string {
  if (p.url) {
    const slug = p.url.split("?")[0].split("/").filter(Boolean).pop();
    if (slug) return slug;
  }
  return Math.random().toString(36).slice(2, 10);
}

/** IG 게시물 → Ad(kind:"organic"). 비클리닉(제품/인플루언서 등)은 제외, 등록 클리닉은 항상 유지. */
// 승인된 병원(런타임, /data) 핸들→이름/지역. 수집 시작 시 채워진다.
let APPROVED_LOOKUP: Map<string, { name: string; areas: Area[]; note?: string }> = new Map();
// 관리자 광고주 유형 오버라이드 — 수집 시작 시 로드, mapPostToAd·게이트에서 참조
let ADV_OVERRIDES: AdvTypeOverrides = {};
function lookupClinic(username: string): { name: string; areas: Area[]; note?: string } | undefined {
  const k = findClinicByHandle(username);
  if (k) return { name: k.name, areas: k.areas, note: k.note };
  return APPROVED_LOOKUP.get(username.toLowerCase());
}

function mapPostToAd(p: IgPost, areaHint?: Area): Ad | null {
  const username = p.ownerUsername?.trim();
  if (!username) return null;
  const caption = (p.caption ?? "").trim();
  if (!caption && !p.displayUrl) return null;

  const known = lookupClinic(username);
  // 등록 클리닉이면 무조건 clinic. 관리자 오버라이드가 있으면 자동 분류를 무시하고 강제
  // (병원↔시술후기로 고정한 계정이 잡계정 판정으로 수집에서 버려지지 않게).
  // 그 외에는 분류(병원/인플루언서/잡계정 제외).
  const advertiserType = known
    ? ("clinic" as const)
    : ADV_OVERRIDES[username.toLowerCase()] ??
      classifyAdvertiser(username, p.ownerFullName, caption, undefined);
  if (advertiserType === null) return null;

  const blob = `${p.ownerFullName ?? ""}\n${caption}`;
  const treatment = inferTreatment(blob);
  // 파생 태그 보충용 확신 분류(미분류=null) — treatment 는 미분류 시 기본값이라 못 쓴다
  const confident = classifyTreatment(blob);
  const style = inferStyle(blob);
  const lang = inferLang(blob);
  const area: Area =
    (known && known.areas.length === 1 ? known.areas[0] : undefined) ??
    areaHint ??
    areaFromText(blob) ??
    "강남";

  const { headline, sub } = buildHeadline(caption || known?.name || username);
  const views = p.videoPlayCount ?? p.videoViewCount;

  return {
    id: `ig-${postId(p)}`,
    clinic: known?.name ?? p.ownerFullName ?? username,
    area,
    treatment,
    treatmentSure: Boolean(confident),
    advertiserType,
    headline: clip(headline || "韓国美容ケア", 30),
    sub: clip(sub || "", 28),
    caption: (caption || "").slice(0, 200),
    hashtags: extractHashtags(caption, confident),
    tags: TAGS_BY_TREATMENT[treatment],
    style,
    palette: PALETTE_BY_TREATMENT[treatment],
    likes: Math.max(0, p.likesCount ?? 0),
    saves: Math.max(0, p.commentsCount ?? 0),
    lang,
    date: (p.timestamp ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10),
    // live 는 일부러 비움 → summarizeTrends 의 팔로워/집행일 지표(광고 전용)를 오염시키지 않음.
    kind: "organic",
    imageUrl: p.displayUrl,
    sourceUrl: p.url ?? `https://www.instagram.com/${username}/`,
    advertiser: p.ownerFullName ?? username,
    igUsername: username,
    views: typeof views === "number" && views > 0 ? views : undefined,
    igLikes: p.likesCount,
    featured: Boolean(known),
    note: known?.note,
  };
}

// ---------- 액터 실행 ----------
async function runIgScraper(
  token: string,
  directUrls: string[],
  resultsLimit: number,
  ms: number
): Promise<IgPost[]> {
  if (directUrls.length === 0 || ms <= 0) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(
        token
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directUrls,
          resultsType: "posts",
          resultsLimit,
          addParentData: false,
          searchType: "hashtag",
          // 서버단 최신성 컷 — 오래된 게시물은 애초에 받지 않아 과금 대상에서 제외.
          onlyPostsNewerThan: `${organicMaxAgeDays()} days`,
        }),
        cache: "no-store",
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      console.error(`[organic] scraper failed: ${res.status} ${res.statusText}`);
      return [];
    }
    const items = await res.json();
    return Array.isArray(items) ? (items as IgPost[]) : [];
  } catch (err) {
    console.error("[organic] scraper error:", err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ---------- TTL 캐시 + 수집 ----------
let cache: { at: number; ads: Ad[] } | null = null;

/**
 * 오가닉 의료 게이트 — 해시태그로 들어온 정체불명 계정(인플루언서·블로그)을 걸러낸다.
 *  통과(OR): ① 등록 클리닉(featured) | ② 계정명/핸들/캡션에 병원 신호 |
 *           ③ 네이버·카카오 지도에서 병원/의원 확인.
 *  검증 키가 없으면 신호 없는 계정은 보수적으로 제외(정밀도 우선).
 */
async function applyOrganicGate(ads: Ad[]): Promise<Ad[]> {
  const decided = new Map<Ad, boolean>();
  const needVerify: Ad[] = [];
  for (const a of ads) {
    if (
      a.advertiserType === "influencer" || // 인플루언서 라벨은 게이트 비대상(당연히 병원 아님)
      ADV_OVERRIDES[a.igUsername?.toLowerCase() ?? ""] != null || // 관리자 지정 계정은 무조건 통과
      a.featured ||
      hasClinicSignal(a.clinic) ||
      hasClinicSignal(a.igUsername) ||
      hasClinicSignal(a.caption)
    ) {
      decided.set(a, true);
    } else {
      needVerify.push(a);
    }
  }
  if (needVerify.length > 0 && hasClinicVerifyKeys()) {
    const names = Array.from(new Set(needVerify.map((a) => a.clinic)));
    const verdicts = await verifyAdvertisers(names);
    for (const a of needVerify) decided.set(a, Boolean(verdicts.get(a.clinic)?.medical));
  } else {
    // 검증 불가 → 병원 신호 없는 계정은 제외(인플루언서·블로그 차단)
    for (const a of needVerify) decided.set(a, false);
  }
  const kept = ads.filter((a) => decided.get(a) === true);
  console.log(`[organic] 의료게이트: ${ads.length} → ${kept.length} (제외 ${ads.length - kept.length})`);
  return kept;
}

export async function fetchOrganicViaApify(
  force = false,
  opts: { profileCap?: number; postsPerProfile?: number; hashtagCap?: number; postsPerTag?: number } = {}
): Promise<Ad[] | null> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return null;
  if (process.env.ORGANIC_ENABLED === "0") return null;

  const ttlMs = num(process.env.ORGANIC_TTL_SECONDS, 604_800) * 1000;
  if (!force && cache && Date.now() - cache.at < ttlMs) return cache.ads;

  const profileCap = opts.profileCap ?? num(process.env.ORGANIC_PROFILE_CAP, 36);
  const postsPerProfile = opts.postsPerProfile ?? num(process.env.ORGANIC_POSTS_PER_PROFILE, 4, 3);
  const hashtagCap = opts.hashtagCap ?? num(process.env.ORGANIC_HASHTAG_CAP, 6);
  const postsPerTag = opts.postsPerTag ?? num(process.env.ORGANIC_POSTS_PER_TAG, 10, 3);

  // 1) 워치리스트: 등록 클리닉 프로필의 최근 게시물 (핸들→지역 매핑 정확)
  // 등록 순서는 강남·홍대가 앞, 명동이 뒤라 낮은 캡에서 명동이 통째로 잘린다.
  // 지역(첫 지역 기준) 라운드로빈으로 뽑아 캡이 낮아도 3지역이 균등하게 들어오게 한다.
  const buckets = new Map<string, string[]>();
  for (const c of KNOWN_CLINICS) {
    const h = c.handle.toLowerCase();
    if (!h) continue;
    const key = c.areas[0] ?? "기타";
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(h);
  }
  // 승인된 병원(관리자 등록)도 워치리스트에 합치고, 매칭용 lookup 구성
  const approved = await readApprovedClinics();
  APPROVED_LOOKUP = new Map(
    approved.map((c) => [c.handle.toLowerCase(), { name: c.name, areas: c.areas as Area[], note: undefined }])
  );
  // 관리자 광고주 유형 오버라이드 로드 — 고정 계정이 자동 분류에 밀려 버려지지 않게
  ADV_OVERRIDES = await readAdvTypeOverrides();
  for (const c of approved) {
    const h = c.handle.toLowerCase();
    if (!h) continue;
    const key = (c.areas[0] as string) ?? "기타";
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(h);
  }
  const order = ["강남", "명동", "홍대", "기타"];
  const handlesAll: string[] = [];
  const picked = new Set<string>();
  for (let i = 0; ; i++) {
    let any = false;
    for (const k of order) {
      const arr = buckets.get(k);
      if (arr && i < arr.length) {
        any = true;
        const h = arr[i];
        if (!picked.has(h)) {
          picked.add(h);
          handlesAll.push(h);
        }
      }
    }
    if (!any) break;
  }
  const handles = handlesAll.slice(0, profileCap);
  const profileUrls = handles.map((h) => `https://www.instagram.com/${h}/`);

  // 2) 해시태그 발굴: 새 병원까지 포함 (area 힌트는 매핑 가능한 범위에서만)
  const tags = hashtagTargets().slice(0, hashtagCap);
  const tagUrls = tags.map(
    (t) => `https://www.instagram.com/explore/tags/${encodeURIComponent(t.tag)}/`
  );

  const out: Ad[] = [];
  try {
    // 워치리스트와 해시태그를 순차 실행(각 150s 상한). 라우트 maxDuration(300s) 안에서 보호.
    const profilePosts = await runIgScraper(token, profileUrls, postsPerProfile, 150_000);
    for (const p of profilePosts) {
      const ad = mapPostToAd(p);
      if (ad) out.push(ad);
    }

    const tagPosts = await runIgScraper(token, tagUrls, postsPerTag, 140_000);
    for (const p of tagPosts) {
      // 발굴 게시물의 지역 힌트: 캡션에서 권역어가 잡히면 그걸로(태그 혼합 실행이라 태그별 매핑 불가)
      const hint = areaFromText(`${p.ownerFullName ?? ""}\n${p.caption ?? ""}`) ?? undefined;
      const ad = mapPostToAd(p, hint ?? undefined);
      if (ad) out.push(ad);
    }
  } catch (err) {
    console.error("[organic] collect error:", err);
    return cache?.ads ?? null;
  }

  // 게시물 단위 중복 제거(같은 url) + 광고주+캡션 동일 도배 제거 + 최신성 컷(안전망)
  // actor onlyPostsNewerThan 이 무시되는 경우(해시태그 등)를 대비해 클라이언트에서 한 번 더 자른다.
  const cutoff = new Date(Date.now() - organicMaxAgeDays() * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const seen = new Set<string>();
  const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const ads = out
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((ad) => {
      if (ad.date < cutoff) return false; // 15일보다 오래된 게시물 제외
      const k1 = ad.id;
      const k2 = `${norm(ad.igUsername ?? ad.clinic)}|${norm(ad.caption).slice(0, 80)}`;
      if (seen.has(k1) || seen.has(k2)) return false;
      seen.add(k1);
      seen.add(k2);
      return true;
    });

  if (ads.length === 0) {
    console.warn(`[organic] 수집 0건 (raw=${out.length}) → 토큰/크레딧/액터 확인.`);
    return cache?.ads ?? null;
  }

  // 의료 게이트로 인플루언서·블로그 제외 (등록 클리닉·병원 신호는 통과)
  const gated = await applyOrganicGate(ads);
  const finalAds = gated.length > 0 ? gated : ads;

  cache = { at: Date.now(), ads: finalAds };
  console.log(`[organic] 수집 완료: raw=${out.length} dedup=${ads.length} 게이트후=${finalAds.length}`);
  return finalAds;
}
