// Meta(페이스북) 광고 라이브러리 → Ad 모델 변환 (온디맨드 수집, 목업 폴백용)
//
// 지역별 검색어(adQueries.ts)를 KR·JP·TW 송출국가로 확장해 활성 광고를 긁어와 본문(캡션)
// 에서 시술·스타일·언어를 추론해 Ad[] 로 매핑한다. 매 수집마다 전체 검색(로테이션 없음, 7일 캐시).
//
// 환경변수:
//   APIFY_TOKEN        (필수) 없으면 수집을 건너뛰고 null 반환 → 목업 폴백.
//   APIFY_AD_ACTOR     (선택) 기본 "curious_coder/facebook-ads-library-scraper"
//   APIFY_PER_QUERY    (선택) 검색당 최대 수집(과금) 건수, 기본 80 (최소 10)
//   APIFY_CONCURRENCY  (선택) 검색 동시 실행 수, 기본 6
//   APIFY_COLLECT_MS   (선택) 수집 시간 예산(ms), 기본 210000 (라우트 300s 보호)
//   APIFY_TTL_SECONDS  (선택) 결과 캐시 TTL(초), 기본 604800 (7일)
//   MAX_ACTIVE_DAYS    (선택) 집행 일수 상한, 기본 30 (초과 광고 제외)

import { Ad, Area, Lang, StyleKey, TreatmentKey, TREATMENT_LABEL } from "./ads";
import { searchQueries, areaFromText, SearchQuery } from "./adQueries";
import { findClinicByHandle, isExcludedAd, isMedicalCategory } from "./clinics";
import { hasClinicVerifyKeys, verifyAdvertisers } from "./clinicVerify";

// ---------- 시술/스타일 추론 사전 ----------

const TREATMENT_KEYWORDS: Record<TreatmentKey, string[]> = {
  물광주사: ["물광", "水光", "水光注射", "水光针", "글로우주사", "skinglow", "글로우"],
  리프팅: ["리프팅", "リフティング", "提升", "线雕", "線雕", "ulthera", "울쎄라", "슈링크", "shurink", "lift", "hifu", "超聲", "超声", "vライン", "v脸", "拉提", "실리프팅"],
  보톡스: ["보톡스", "ボトックス", "肉毒", "瘦脸针", "瘦臉", "botox", "사각턱", "エラ"],
  필러: ["필러", "フィラー", "玻尿酸", "ヒアルロン酸", "filler", "히알루론"],
  미백토닝: ["미백", "토닝", "美白", "トーニング", "调理", "提亮", "toning", "whitening", "레이저토닝", "잡티", "シミ", "美白肌"],
  모공여드름: ["모공", "여드름", "毛穴", "ニキビ", "毛孔", "祛痘", "痘", "暗瘡", "pore", "acne", "트러블", "흉터"],
  스킨부스터: ["스킨부스터", "スキンブースター", "肤质", "膚質", "booster", "리쥬란", "rejuran", "인모드", "juvelook", "쥬베룩", "ブースター"],
};

const PROMO_KEYWORDS = ["이벤트", "할인", "프로모션", "期間限定", "キャンペーン", "优惠", "優惠", "活动", "活動", "限定", "sale", "off", "%", "특가", "오픈", "初回", "特別価格", "企劃"];
const BEFORE_AFTER_KEYWORDS = ["비포", "애프터", "before", "after", "ビフォー", "アフター", "前後", "前后", "对比", "對比", "변화"];
const INFO_KEYWORDS = ["효과", "원리", "について", "ポイント", "解説", "知っ", "tip", "꿀팁", "정보", "차이", "技術", "原理"];

const PALETTE_BY_TREATMENT: Record<TreatmentKey, [string, string]> = {
  물광주사: ["#a7f3d0", "#5eead4"],
  리프팅: ["#fbcfe8", "#f9a8d4"],
  보톡스: ["#fde68a", "#fcd34d"],
  필러: ["#fecaca", "#fca5a5"],
  미백토닝: ["#bae6fd", "#7dd3fc"],
  모공여드름: ["#ddd6fe", "#c4b5fd"],
  스킨부스터: ["#a5f3fc", "#67e8f9"],
};

const TAGS_BY_TREATMENT: Record<TreatmentKey, string[]> = {
  물광주사: ["물광", "톤업", "수분"],
  리프팅: ["리프팅", "탄력", "V라인"],
  보톡스: ["보톡스", "주름", "동안"],
  필러: ["필러", "윤곽", "볼륨"],
  미백토닝: ["미백", "톤업", "잡티"],
  모공여드름: ["모공", "여드름", "트러블"],
  스킨부스터: ["수분", "광채", "탄력"],
};

const DEFAULT_TREATMENT: TreatmentKey = "물광주사";

// ---------- 추론 헬퍼 ----------

function inferTreatment(text: string): TreatmentKey {
  const lower = text.toLowerCase();
  for (const key of Object.keys(TREATMENT_KEYWORDS) as TreatmentKey[]) {
    if (TREATMENT_KEYWORDS[key].some((kw) => lower.includes(kw.toLowerCase()))) {
      return key;
    }
  }
  return DEFAULT_TREATMENT;
}

function inferStyle(text: string): StyleKey {
  const lower = text.toLowerCase();
  if (PROMO_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "프로모션";
  if (BEFORE_AFTER_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "비포애프터";
  if (INFO_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "정보형";
  return "감성";
}

// 언어 추론 — "있는지"가 아니라 "어느 문자가 더 많은지"(우세 문자)로 판별한다.
//   중국어 광고에 한글 해시태그(#강남 #부산)가 몇 개 섞였다고 한국어로 분류되면 안 된다.
//   hint = 검색어 언어(jp/kr/cn) — 한자만 있는 모호한 경우의 최종 타이브레이커.
// 우선순위: 가나(일본어 고유) > 한글vs한자 우세 비교 > 한자만이면 hint.
function inferLang(text: string, hint?: "jp" | "kr" | "cn"): Lang {
  // 가나(히라가나·가타카나)는 일본어에만 있음 → 1자라도 있으면 일본어
  if (/[぀-ヿ]/.test(text)) return "JP";
  const hangul = (text.match(/[가-힣]/g) || []).length;
  const han = (text.match(/[㐀-鿿]/g) || []).length; // 한자(중국어·번체 포함)
  // 한자가 한글보다 많으면 한자권 광고 — 일본어권 검색이면 JP, 아니면 CN
  // (한글 해시태그 몇 개 섞인 중국어 광고가 KR로 새는 것을 방지)
  if (han > hangul) return hint === "jp" ? "JP" : "CN";
  if (hangul > 0) return "KR"; // 한글 우세 → 한국어
  // 문자 정보가 거의 없으면 검색어 언어로 결정 (cn→CN, 그 외 JP)
  return hint === "cn" ? "CN" : "JP";
}

function extractHashtags(text: string, treatment: TreatmentKey): string[] {
  const found = (text.match(/#[^\s#.,!?，。！？]+/g) ?? []).slice(0, 6);
  if (found.length >= 3) return Array.from(new Set(found)).slice(0, 5);
  const fallback = ["#韓国美容", ...TAGS_BY_TREATMENT[treatment].map((t) => `#${t}`)];
  return Array.from(new Set([...found, ...fallback])).slice(0, 5);
}

/** 본문에서 해시태그/멘션/URL을 걷어내고 메인 카피 1~2줄 추출 */
function buildHeadline(caption: string): { headline: string; sub: string } {
  const lines = caption
    .replace(/https?:\/\/\S+/g, "")
    .split(/[\n。！？!?]/)
    .map((l) => l.replace(/#[^\s#]+/g, "").replace(/@[^\s@]+/g, "").trim())
    .filter((l) => l.length > 1);

  const headline = (lines[0] ?? caption.trim()).slice(0, 28) || "韓国美容ケア";
  const sub = (lines[1] ?? "").slice(0, 26);
  return { headline, sub };
}

function activeDays(start?: string, end?: string): number {
  if (!start) return 0;
  const s = new Date(start.replace(" ", "T")).getTime();
  if (Number.isNaN(s)) return 0;
  const endMs = end ? new Date(end.replace(" ", "T")).getTime() : Date.now();
  const e = Number.isNaN(endMs) ? Date.now() : Math.min(endMs, Date.now());
  return Math.max(0, Math.round((e - s) / 86_400_000));
}

// 집행 일수 상한: 이 일수를 초과해 오래 돌고 있는 광고는 제외(최신 트렌드만 노출).
// 시작일 미상(days=0)은 유지. 환경변수 MAX_ACTIVE_DAYS 로 조정 가능(기본 30).
function maxActiveDays(): number {
  return Math.max(1, Number(process.env.MAX_ACTIVE_DAYS) || 30);
}

// ---------- 광고 라이브러리 항목 → Ad ----------

interface FbMedia {
  original_image_url?: string | null;
  resized_image_url?: string | null;
  video_preview_image_url?: string | null;
}

interface FbSnapshot {
  body?: { text?: string } | string | null;
  title?: string | null;
  caption?: string | null;
  cta_text?: string | null;
  link_url?: string | null;
  page_like_count?: number | null;
  page_categories?: string[] | null;
  images?: FbMedia[] | null;
  videos?: FbMedia[] | null;
  cards?: FbMedia[] | null;
}

/** 광고 크리에이티브 대표 썸네일 추출 (이미지 → 영상 프리뷰 → 캐러셀 순) */
function pickImage(s: FbSnapshot): string | undefined {
  const img = s.images?.[0];
  if (img?.resized_image_url || img?.original_image_url) {
    return img.resized_image_url || img.original_image_url || undefined;
  }
  const vid = s.videos?.[0];
  if (vid?.video_preview_image_url) return vid.video_preview_image_url;
  const card = s.cards?.[0];
  if (card) {
    return (
      card.resized_image_url ||
      card.original_image_url ||
      card.video_preview_image_url ||
      undefined
    );
  }
  return undefined;
}

interface FbAd {
  ad_archive_id?: string;
  page_name?: string;
  publisher_platform?: string[];
  start_date_formatted?: string;
  end_date_formatted?: string;
  ad_library_url?: string;
  url?: string;
  snapshot?: FbSnapshot;
  advertiser?: {
    ad_library_page_info?: {
      page_info?: {
        ig_username?: string | null;
        ig_followers?: number | null;
        page_category?: string | null;
      };
    };
  };
}

function bodyText(s?: FbSnapshot): string {
  if (!s?.body) return "";
  return typeof s.body === "string" ? s.body : s.body.text ?? "";
}

function mapFbAdToAd(fb: FbAd, fallbackArea?: Area, langHint?: "jp" | "kr" | "cn"): Ad | null {
  const s = fb.snapshot ?? {};
  const body = bodyText(s).trim();
  const title = (s.title ?? "").trim();
  if (!body && !title) return null;

  const blob = `${title}\n${body}`;
  const treatment = inferTreatment(blob);
  const style = inferStyle(blob);
  const lang = inferLang(blob, langHint);

  // 광고주 인스타 핸들 + Meta 페이지 카테고리 → 클리닉 판별/정밀 매핑
  const pageInfo = fb.advertiser?.ad_library_page_info?.page_info;
  const igUsername = pageInfo?.ig_username?.trim() || undefined;
  const pageCategory = pageInfo?.page_category?.trim() || s.page_categories?.[0] || undefined;

  // 클리닉 아닌 광고(제품/인플루언서/대행사/여행 등) 제외 (허용 클리닉/의료 카테고리는 항상 유지)
  if (isExcludedAd(igUsername, fb.page_name, blob, pageCategory)) return null;

  const known = findClinicByHandle(igUsername);

  // 지역: 등록 클리닉이 단일 지역이면 그걸로, 아니면 URL/본문 추론, 최후엔 강남
  const area: Area =
    (known && known.areas.length === 1 ? known.areas[0] : undefined) ??
    areaFromText(fb.url ?? "") ??
    areaFromText(blob) ??
    fallbackArea ??
    "강남";
  const treatmentLabel = lang === "JP" ? TREATMENT_LABEL[treatment].jp : TREATMENT_LABEL[treatment].ko;

  // FB의 title 은 CTA/페이지명/링크인 경우가 많아 본문 카피를 헤드라인으로 우선한다.
  const { headline: hl, sub: sb } = buildHeadline(body || title);
  const looksBad = (t: string) =>
    !t || t.trim().length < 3 || /https?:|instagram\.com|^line\b|\b(line|lin)\.(ee|me)\b|add line|visit instagram|\.(com|net|ly|me)\b/i.test(t);
  let headline = hl;
  if (looksBad(headline)) headline = looksBad(title) ? treatmentLabel : title;
  headline = headline.slice(0, 28);
  const sub = (sb && !looksBad(sb) ? sb : treatmentLabel).slice(0, 26);

  const days = activeDays(fb.start_date_formatted, fb.end_date_formatted);
  // 집행 일수가 상한(기본 30일)을 넘는 오래된 광고는 제외 (시작일 미상 days=0 은 유지)
  if (days > maxActiveDays()) return null;
  const id = fb.ad_archive_id || Math.random().toString(36).slice(2, 10);
  const igFollowers = Math.max(0, pageInfo?.ig_followers ?? 0);

  // 클릭 목적지: 인스타 프로필 우선 → 인스타 링크 → 기타 랜딩(LINE 등) → 라이브러리
  const igUrl = igUsername ? `https://www.instagram.com/${igUsername}/` : undefined;
  const linkIsInstagram = (s.link_url ?? "").includes("instagram.com");
  const sourceUrl =
    igUrl ||
    (linkIsInstagram ? s.link_url! : undefined) ||
    s.link_url ||
    fb.ad_library_url ||
    undefined;

  return {
    id: `fb-${id}`,
    clinic: fb.page_name?.trim() || "광고주 미상",
    area,
    treatment,
    headline,
    sub,
    caption: (body || title).slice(0, 200),
    hashtags: extractHashtags(body, treatment),
    tags: TAGS_BY_TREATMENT[treatment],
    style,
    palette: PALETTE_BY_TREATMENT[treatment],
    // 팔로워 수를 인기 지표로 사용 (없으면 페이지 좋아요)
    likes: igFollowers || Math.max(0, s.page_like_count ?? 0),
    saves: days,
    lang,
    date: fb.start_date_formatted?.slice(0, 10) || new Date().toISOString().slice(0, 10),

    live: true,
    imageUrl: pickImage(s),
    sourceUrl,
    adLibraryUrl: fb.ad_library_url || undefined,
    cta: s.cta_text || undefined,
    platforms: fb.publisher_platform || undefined,
    activeDays: days,
    advertiser: fb.page_name || undefined,
    igUsername,
    pageCategory,
    featured: Boolean(known),
    note: known?.note,
  };
}

// ---------- 수집 (TTL 캐시 + 폴백) ----------

let cache: { at: number; ads: Ad[] } | null = null;

function actorEndpoint(): string {
  const actor = (process.env.APIFY_AD_ACTOR || "curious_coder/facebook-ads-library-scraper").replace("/", "~");
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items`;
}

/** 단일 검색 URL에 대해 액터 1회 실행 (실패/시간초과 시 빈 배열).
 *  deadline(절대 ms)을 주면 런 상한을 min(150s, 남은 예산)으로 묶어 수집 전체가
 *  라우트 시간제한을 넘지 않게 한다. 남은 예산이 없으면 호출을 건너뛴다. */
async function runActorForUrl(
  token: string,
  url: string,
  count: number,
  country: string,
  deadline?: number
): Promise<FbAd[]> {
  const ms = deadline ? Math.min(150_000, deadline - Date.now()) : 150_000;
  if (ms <= 0) return []; // 예산 소진 → 건너뜀
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(`${actorEndpoint()}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [{ url }],
        scrapeAdDetails: true,
        count,
        "scrapePageAds.activeStatus": "active",
        "scrapePageAds.countryCode": country,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[apify] run failed: ${res.status} ${res.statusText}`);
      return [];
    }
    const items = await res.json();
    return Array.isArray(items) ? (items as FbAd[]) : [];
  } catch (err) {
    console.error("[apify] run error:", err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 검색 쿼리들을 동시성 풀 + 시간 예산으로 수집해 Ad[] 로 매핑.
 * - 동시성(APIFY_CONCURRENCY, 기본 6): Apify 동시 실행 한도를 넘지 않게 풀로 제어.
 * - 시간 예산(APIFY_COLLECT_MS, 기본 210s): 라우트 maxDuration(300s) 안에서 의료검증까지
 *   끝낼 수 있게, 예산을 넘기면 남은 쿼리는 건너뛰고 모은 만큼 반환(부분이라도 폭넓게).
 */
async function collectAds(
  token: string,
  queries: SearchQuery[],
  perQuery: number
): Promise<Ad[]> {
  const concurrency = Math.max(1, Number(process.env.APIFY_CONCURRENCY) || 6);
  const budgetMs = Math.max(60_000, Number(process.env.APIFY_COLLECT_MS) || 210_000);
  const deadline = Date.now() + budgetMs;
  const out: Ad[] = [];
  let next = 0;

  async function worker() {
    while (next < queries.length && Date.now() < deadline) {
      const q = queries[next++];
      const items = await runActorForUrl(token, q.url, perQuery, q.country, deadline);
      for (const fb of items) {
        const ad = mapFbAdToAd(fb, q.area, q.lang);
        if (ad) out.push(ad);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, queries.length) }, worker);
  await Promise.all(workers);
  return out;
}

export async function fetchAdsViaApify(): Promise<Ad[] | null> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return null;

  const ttlMs = (Number(process.env.APIFY_TTL_SECONDS) || 604_800) * 1000;
  if (cache && Date.now() - cache.at < ttlMs) {
    return cache.ads;
  }

  const queries = searchQueries();
  // 검색당 최대 수집 건수 (액터 최소 10). URL의 start_date[min] 덕에 최근 광고만 반환되므로
  // 예전보다 높여도 시간 예산 내에 소화 가능. 낮으면 광고가 적게 보임 ↔ 높이면 비용·시간↑.
  const perQuery = Math.max(10, Number(process.env.APIFY_PER_QUERY) || 80);

  try {
    const collected = await collectAds(token, queries, perQuery);

    // 중복 제거(칼같이) — 두 기준 중 하나라도 걸리면 제외:
    //  ① 크리에이티브 동일: 같은 광고주가 "똑같은 카피" 광고를 여러 건(=같은 이미지 도배)
    //     → 광고주+카피(공백 제거 앞 80자) 기준 1건. 지역/시술/언어 추론이 흔들려도 확실히 묶임.
    //  ② 슬롯 동일: 같은 광고주+지역+시술+언어의 변형(가격표 등 미세차이) → 1건.
    // 언어(lang)를 ②에 포함하는 게 핵심: 한국 클리닉은 국내 KR 광고가 훨씬 많아, 언어를 빼면
    //   대표가 거의 KR로 잡혀 일본인(JP) 광고가 묻힌다. 언어를 넣으면 JP·KR·CN이 각 1건씩 생존.
    const seenCreative = new Set<string>();
    const seenSlot = new Set<string>();
    const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
    const ads = collected
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((ad) => {
        const adv = norm(ad.igUsername ?? ad.clinic ?? "");
        const creativeKey = `${adv}|${norm(ad.caption || ad.headline || "").slice(0, 80)}`;
        const slotKey = `${adv}|${ad.area}|${ad.treatment}|${ad.lang}`;
        if (seenCreative.has(creativeKey) || seenSlot.has(slotKey)) return false;
        seenCreative.add(creativeKey);
        seenSlot.add(slotKey);
        return true;
      });

    if (ads.length === 0) return cache?.ads ?? null;

    // 네이버·카카오 지역검색(무료)으로 광고주가 실제 병원/의원인지 검증해
    // 비의료(화장품·제품 등) 광고를 제외한다. Apify 추가 호출 없음.
    const gated = await applyMedicalGate(ads);

    cache = { at: Date.now(), ads: gated };
    return gated;
  } catch (err) {
    console.error("[apify] collect error:", err);
    return cache?.ads ?? null;
  }
}

/**
 * 광고주가 실제 의료기관인지 네이버·카카오 지역검색으로 검증해 비의료 광고 제외.
 * 통과 조건(OR): 등록 클리닉(allowlist) | Meta 의료 카테고리 | 지도에서 병원/의원 확인.
 * 검증 키가 없거나(휴리스틱 폴백) 결과가 비정상으로 전부 걸러지면 원본 유지.
 */
async function applyMedicalGate(ads: Ad[]): Promise<Ad[]> {
  if (!hasClinicVerifyKeys()) return ads;
  // 등록 클리닉·Meta 의료 카테고리는 검증 없이 통과 → 애매한 광고주만 지도 검증(속도↑·호출↓)
  const ambiguous = ads.filter((a) => !a.featured && !isMedicalCategory(a.pageCategory));
  const names = Array.from(new Set(ambiguous.map((a) => a.clinic)));
  const verdicts = await verifyAdvertisers(names);
  const kept = ads.filter((a) => {
    if (a.featured) return true; // 등록 클리닉(allowlist)
    if (isMedicalCategory(a.pageCategory)) return true; // Meta 의료 카테고리
    return Boolean(verdicts.get(a.clinic)?.medical); // 지도에서 병원/의원 확인
  });
  return kept.length > 0 ? kept : ads;
}

// ---------- 2단계: 인스타그램 조회수 보강 ----------

function median(nums: number[]): number | undefined {
  const arr = nums.filter((n) => typeof n === "number" && n > 0).sort((a, b) => a - b);
  if (arr.length === 0) return undefined;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
}

interface IgPost {
  ownerUsername?: string;
  type?: string;
  likesCount?: number;
  videoPlayCount?: number;
  videoViewCount?: number;
}

export interface HandleStats {
  views?: number;
  igLikes?: number;
}

let viewsCache: { at: number; map: Record<string, HandleStats> } | null = null;

/**
 * 광고주 IG 핸들들의 최근 게시물에서 조회수(릴스 재생수)/좋아요 대표값(중앙값)을 수집.
 * 토큰 없거나 실패 시 빈 객체. TTL 캐시.
 */
export async function fetchViewsForHandles(
  handles: string[]
): Promise<Record<string, HandleStats>> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return {};

  const uniq = Array.from(new Set(handles.filter(Boolean).map((h) => h.toLowerCase())));
  if (uniq.length === 0) return {};

  const ttlMs = (Number(process.env.APIFY_TTL_SECONDS) || 604_800) * 1000;
  if (viewsCache && Date.now() - viewsCache.at < ttlMs) {
    // 캐시에 모든 핸들이 있으면 재사용
    if (uniq.every((h) => h in viewsCache!.map)) return viewsCache.map;
  }

  const cap = Math.max(1, Number(process.env.APIFY_IG_PROFILES_CAP) || 40);
  const postsPer = Math.max(3, Number(process.env.APIFY_IG_POSTS) || 8);
  const targets = uniq.slice(0, cap);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 280_000);
  try {
    const actor = "apify~instagram-scraper";
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directUrls: targets.map((h) => `https://www.instagram.com/${h}/`),
          resultsType: "posts",
          resultsLimit: postsPer,
          addParentData: false,
        }),
        cache: "no-store",
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      console.error(`[apify/views] failed: ${res.status}`);
      return viewsCache?.map ?? {};
    }
    const posts = (await res.json()) as IgPost[];
    if (!Array.isArray(posts)) return viewsCache?.map ?? {};

    // 핸들별로 그룹핑 (본인 게시물만)
    const grouped = new Map<string, IgPost[]>();
    for (const p of posts) {
      const owner = p.ownerUsername?.toLowerCase();
      if (!owner || !targets.includes(owner)) continue;
      (grouped.get(owner) ?? grouped.set(owner, []).get(owner)!).push(p);
    }

    const map: Record<string, HandleStats> = { ...(viewsCache?.map ?? {}) };
    for (const h of targets) {
      const ps = grouped.get(h) ?? [];
      const plays = ps.map((p) => p.videoPlayCount ?? p.videoViewCount ?? 0);
      const likes = ps.map((p) => p.likesCount ?? 0);
      map[h] = { views: median(plays), igLikes: median(likes) };
    }

    viewsCache = { at: Date.now(), map };
    return map;
  } catch (err) {
    console.error("[apify/views] error:", err);
    return viewsCache?.map ?? {};
  } finally {
    clearTimeout(timeout);
  }
}

/** 광고 목록에 IG 조회수/좋아요를 병합 */
export async function enrichAdsWithViews(ads: Ad[]): Promise<Ad[]> {
  const handles = ads.map((a) => a.igUsername).filter((h): h is string => Boolean(h));
  if (handles.length === 0) return ads;
  const stats = await fetchViewsForHandles(handles);
  return ads.map((a) => {
    const s = a.igUsername ? stats[a.igUsername.toLowerCase()] : undefined;
    if (!s) return a;
    return { ...a, views: s.views, igLikes: s.igLikes };
  });
}
