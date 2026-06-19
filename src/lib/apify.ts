// Apify Instagram 스크래퍼 → Ad 모델 변환 (온디맨드 수집, 목업 폴백용)
//
// CLINIC_ACCOUNTS 에 등록된 클리닉 인스타 계정의 최신 게시물을 긁어와
// 캡션에서 시술·스타일·언어를 추론해 Ad[] 로 매핑합니다.
//
// 환경변수:
//   APIFY_TOKEN            (필수) Apify API 토큰. 없으면 수집을 건너뛰고 null 반환 → 목업 폴백.
//   APIFY_INSTAGRAM_ACTOR  (선택) 기본 "apify/instagram-scraper"
//   APIFY_RESULTS_LIMIT    (선택) 계정당 게시물 수, 기본 6
//   APIFY_TTL_SECONDS      (선택) 결과 캐시 TTL(초), 기본 3600

import { Ad, Lang, StyleKey, TreatmentKey } from "./ads";
import { resolveClinicAccounts, findClinic, ClinicAccount } from "./clinics";

// ---------- 시술/스타일 추론 사전 ----------

const TREATMENT_KEYWORDS: Record<TreatmentKey, string[]> = {
  물광주사: ["물광", "水光", "水光注射", "水光针", "글로우주사", "skinglow"],
  리프팅: ["리프팅", "リフティング", "提升", "线雕", "ulthera", "울쎄라", "슈링크", "shurink", "lift", "vライン", "v脸", "실리프팅"],
  보톡스: ["보톡스", "ボトックス", "肉毒", "瘦脸针", "botox", "사각턱"],
  필러: ["필러", "フィラー", "玻尿酸", "ヒアルロン酸", "filler", "히알루론"],
  미백토닝: ["미백", "토닝", "美白", "トーニング", "调理", "提亮", "toning", "whitening", "레이저토닝", "잡티"],
  모공여드름: ["모공", "여드름", "毛穴", "ニキビ", "毛孔", "祛痘", "痘", "pore", "acne", "트러블", "흉터"],
  스킨부스터: ["스킨부스터", "スキンブースター", "肤质", "booster", "리쥬란", "rejuran", "인모드", "juvelook", "쥬베룩"],
};

const PROMO_KEYWORDS = ["이벤트", "할인", "프로모션", "期間限定", "キャンペーン", "优惠", "活动", "限定", "sale", "off", "%", "특가", "오픈"];
const BEFORE_AFTER_KEYWORDS = ["비포", "애프터", "before", "after", "ビフォー", "アフター", "前後", "前后", "对比", "변화"];
const INFO_KEYWORDS = ["효과", "원리", "について", "ポイント", "解説", "知っ", "tip", "꿀팁", "정보", "차이"];

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

// ---------- 추론 헬퍼 ----------

function inferTreatment(text: string, fallback: TreatmentKey): TreatmentKey {
  const lower = text.toLowerCase();
  for (const key of Object.keys(TREATMENT_KEYWORDS) as TreatmentKey[]) {
    if (TREATMENT_KEYWORDS[key].some((kw) => lower.includes(kw.toLowerCase()))) {
      return key;
    }
  }
  return fallback;
}

function inferStyle(text: string): StyleKey {
  const lower = text.toLowerCase();
  if (PROMO_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "프로모션";
  if (BEFORE_AFTER_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "비포애프터";
  if (INFO_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "정보형";
  return "감성";
}

function inferLang(text: string): Lang {
  // 가나(히라가나/가타카나)가 있으면 일본어 타겟
  if (/[぀-ヿ]/.test(text)) return "JP";
  // 중국어 간체에서 주로 쓰는 글자/표현이 보이면 중국어 타겟
  if (/[优惠脸韩针这产价钟约]/.test(text)) return "CN";
  return "JP";
}

function extractHashtags(text: string, treatment: TreatmentKey): string[] {
  const found = (text.match(/#[^\s#.,!?，。！？]+/g) ?? []).slice(0, 6);
  if (found.length >= 3) return Array.from(new Set(found)).slice(0, 5);
  const fallback = ["#韓国美容", ...TAGS_BY_TREATMENT[treatment].map((t) => `#${t}`)];
  return Array.from(new Set([...found, ...fallback])).slice(0, 5);
}

/** 캡션에서 해시태그/멘션/URL/이모지성 기호를 걷어내고 메인 카피 1~2줄 추출 */
function buildHeadline(caption: string): { headline: string; sub: string } {
  const lines = caption
    .replace(/https?:\/\/\S+/g, "")
    .split(/[\n。！？!?]/)
    .map((l) => l.replace(/#[^\s#]+/g, "").replace(/@[^\s@]+/g, "").trim())
    .filter((l) => l.length > 1);

  const headline = (lines[0] ?? caption.trim()).slice(0, 22) || "韓国美容ケア";
  const sub = (lines[1] ?? "").slice(0, 24);
  return { headline, sub };
}

// ---------- Apify 게시물 → Ad ----------

interface ApifyPost {
  id?: string;
  shortCode?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
  ownerUsername?: string;
  url?: string;
}

function mapPostToAd(post: ApifyPost, account: ClinicAccount): Ad | null {
  const caption = (post.caption ?? "").trim();
  if (!caption) return null;

  const treatment = inferTreatment(caption, account.fallbackTreatment);
  const style = inferStyle(caption);
  const lang = inferLang(caption);
  const { headline, sub } = buildHeadline(caption);
  const likes = Math.max(0, post.likesCount ?? 0);
  const saves = Math.max(0, post.commentsCount ?? 0);
  const code = post.shortCode || post.id || Math.random().toString(36).slice(2, 9);

  return {
    id: `apify-${account.username}-${code}`,
    clinic: `${account.clinic} (${account.area})`,
    area: account.area,
    treatment,
    headline,
    sub: sub || (lang === "JP" ? "韓国スキンケア" : "韩国护肤"),
    caption: caption.slice(0, 180),
    hashtags: extractHashtags(caption, treatment),
    tags: TAGS_BY_TREATMENT[treatment],
    style,
    palette: PALETTE_BY_TREATMENT[treatment],
    likes,
    saves,
    lang,
    date: post.timestamp ? post.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

// ---------- 수집 (TTL 캐시 + 폴백) ----------

let cache: { at: number; ads: Ad[] } | null = null;

function actorEndpoint(): string {
  const actor = (process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-scraper").replace("/", "~");
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items`;
}

/**
 * Apify 로 클리닉 계정 최신 게시물을 수집해 Ad[] 로 반환.
 * 토큰이 없거나 수집에 실패하면 null 을 반환 → 호출부에서 목업으로 폴백.
 */
export async function fetchAdsViaApify(): Promise<Ad[] | null> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return null;

  const ttlMs = (Number(process.env.APIFY_TTL_SECONDS) || 3600) * 1000;
  if (cache && Date.now() - cache.at < ttlMs) {
    return cache.ads;
  }

  const accounts = resolveClinicAccounts();
  const resultsLimit = Number(process.env.APIFY_RESULTS_LIMIT) || 6;
  const directUrls = accounts.map((a) => `https://www.instagram.com/${a.username}/`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(`${actorEndpoint()}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        directUrls,
        resultsType: "posts",
        resultsLimit,
        searchType: "user",
        addParentData: false,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[apify] run failed: ${res.status} ${res.statusText}`);
      return cache?.ads ?? null;
    }

    const items = (await res.json()) as ApifyPost[];
    if (!Array.isArray(items)) return cache?.ads ?? null;

    const ads = items
      .map((post) => {
        const account =
          findClinic(post.ownerUsername ?? "") ??
          accounts.find((a) => a.username === post.ownerUsername) ??
          accounts[0];
        return mapPostToAd(post, account);
      })
      .filter((ad): ad is Ad => ad !== null)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (ads.length === 0) return cache?.ads ?? null;

    cache = { at: Date.now(), ads };
    return ads;
  } catch (err) {
    console.error("[apify] fetch error:", err);
    return cache?.ads ?? null;
  } finally {
    clearTimeout(timeout);
  }
}
