// Meta(페이스북) 광고 라이브러리 수집용 검색어 (일본인·한국인·중국인 타겟)
//
// 강남·명동·홍대를 "권역"으로 넓게 잡는다:
//   강남 = 강남·신사·압구정·역삼·청담·논현
//   명동 = 명동·을지로·충무로·회현·남대문·중구
//   홍대 = 홍대·합정·상수·연남·연희·망원
// 권역 내 주요 동/역명을 KR·JP·CN 검색어로 분산 배치해, 한 번의 수집에서 아래
// 검색어를 "모두" 훑는다(주차 로테이션 없음 — 최대 커버리지). 결과는 7일 캐시.
//
// 지역 판별은 검색 URL/본문에서 AREA_TERMS(권역 표기, JP한자·CN간체 포함)로 추론한다.
// 언어는 본문에서 추론(apify.ts inferLang)하므로 검색어 언어 = 결과 언어가 항상
// 일치하진 않는다. 검색어는 "그 언어권 광고가 걸릴 확률"을 높이는 용도.
//
// 출처: 운영 Notion "인스타그램 검색 키워드" + 권역 확장.

import { Area } from "./ads";

interface LangQueries {
  jp: string[];
  kr: string[];
  cn: string[];
}

// 지역(권역)별 검색어 — 권역 내 동/역명을 언어별로 분산 배치해 넓게 커버
const AREA_QUERIES: Record<Area, LangQueries> = {
  강남: {
    jp: ["江南 皮膚科", "狎鴎亭 皮膚科", "新沙 美容クリニック"],
    kr: ["강남 피부과", "역삼 피부과"],
    cn: ["江南 皮肤科", "清潭 医美"],
  },
  명동: {
    jp: ["明洞 皮膚科", "明洞 美容皮膚科", "乙支路 皮膚科"],
    kr: ["명동 피부과", "충무로 피부과"],
    cn: ["明洞 皮肤科", "明洞 医美"],
  },
  홍대: {
    jp: ["弘大 皮膚科", "ホンデ 美容クリニック", "合井 皮膚科"],
    kr: ["홍대 피부과", "연남 피부과"],
    cn: ["弘大 皮肤科", "弘大 医美"],
  },
};

// 지역 없는 일반(시술) 검색어 — 본문에서 지역 추론, 없으면 강남 기본
const GENERAL_QUERIES: LangQueries = {
  jp: [
    "韓国 美容皮膚科 日本語",
    "韓国 水光注射 日本人",
    "韓国 リフティング 糸リフト",
    "韓国 ボトックス おすすめ",
  ],
  kr: ["서울 피부과 이벤트"],
  cn: ["韩国 皮肤管理 中文", "韩国 医美 中文", "韩国 水光针"],
};

/** 지역 판별용 표기 (검색 URL/본문 모두에서 탐지) — 권역 동/역명, JP한자·CN간체 포함 */
const AREA_TERMS: Record<Area, string[]> = {
  // 강남 권역: 신사·압구정·역삼·청담·논현 포함 (狎鴎亭=JP, 狎鸥亭=CN 간체)
  강남: [
    "江南", "カンナム", "강남", "gangnam",
    "狎鴎亭", "狎鸥亭", "압구정", "アックジョン",
    "清潭", "청담", "チョンダム",
    "新沙", "신사", "シンサ",
    "역삼", "駅三", "驛三", "yeoksam",
    "논현", "論峴", "선릉", "도산",
  ],
  // 명동 권역: 을지로·충무로·회현·남대문·중구 포함
  명동: [
    "明洞", "ミョンドン", "명동", "myeongdong", "myeong-dong",
    "乙支路", "을지로", "euljiro",
    "忠武路", "충무로", "chungmuro",
    "회현", "會賢", "남대문", "南大門",
    "중구", "中区", "中區",
  ],
  // 홍대 권역: 합정·상수·연남·연희·망원 포함
  홍대: [
    "弘大", "ホンデ", "홍대", "hongdae", "hong-dae",
    "合井", "합정", "hapjeong",
    "上水", "상수", "sangsu",
    "延南", "연남", "yeonnam",
    "延禧", "연희", "망원", "望遠", "mangwon",
  ],
};

const AD_LIBRARY_BASE = "https://www.facebook.com/ads/library/";

/** 검색어로 광고 라이브러리 검색 URL 생성 (KR · 활성 · 노출수 내림차순) */
export function buildAdLibraryUrl(keyword: string): string {
  const params = new URLSearchParams({
    active_status: "active",
    ad_type: "all",
    country: "KR",
    is_targeted_country: "false",
    media_type: "all",
    q: keyword,
    search_type: "keyword_unordered",
    "sort_data[direction]": "desc",
    "sort_data[mode]": "total_impressions",
  });
  return `${AD_LIBRARY_BASE}?${params.toString()}`;
}

export interface SearchQuery {
  /** 지역이 확정된 검색이면 지역, 일반 검색이면 undefined */
  area?: Area;
  keyword: string;
  url: string;
}

/** 여러 리스트를 라운드로빈으로 평탄화 ([a0,b0,c0,a1,b1,...]) */
function roundRobin<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < maxLen; i++) {
    for (const l of lists) if (l[i] !== undefined) out.push(l[i]);
  }
  return out;
}

/**
 * 이번 수집의 전체 검색 쿼리 — 지역(권역)별 KR·JP·CN + 일반(시술) 검색어를 "모두" 훑는다.
 *   지역 3 × (JP 3 + KR 2 + CN 2 = 7) + 일반 (JP 4 + KR 1 + CN 3 = 8) = 29개 검색.
 *   주차 로테이션 없이 매 수집마다 전부 실행(최대 커버리지). 결과는 7일 캐시되어
 *   실제 수집은 주 1회 수준. 수집량/속도는 APIFY_PER_QUERY·APIFY_CONCURRENCY 로 조절.
 *
 *   순서는 (언어 × 권역) 라운드로빈으로 인터리브한다 — 수집 시간 예산(APIFY_COLLECT_MS)에
 *   잘려 일부만 실행되더라도 강남·명동·홍대 3권역과 JP·KR·CN 3언어가 고루 섞이도록.
 */
export function searchQueries(): SearchQuery[] {
  const areas = Object.keys(AREA_QUERIES) as Area[];
  const langs: (keyof LangQueries)[] = ["jp", "kr", "cn"];

  // (언어, 권역) 스트림들을 라운드로빈 → 앞쪽부터 전 권역·언어를 고루 커버
  const streams: { area: Area; words: string[] }[] = [];
  for (const lang of langs) {
    for (const area of areas) streams.push({ area, words: AREA_QUERIES[area][lang] });
  }
  const areaQs: SearchQuery[] = [];
  const maxLen = Math.max(0, ...streams.map((s) => s.words.length));
  for (let i = 0; i < maxLen; i++) {
    for (const s of streams) {
      const keyword = s.words[i];
      if (keyword) areaQs.push({ area: s.area, keyword, url: buildAdLibraryUrl(keyword) });
    }
  }

  const generalQs: SearchQuery[] = roundRobin([
    GENERAL_QUERIES.jp,
    GENERAL_QUERIES.kr,
    GENERAL_QUERIES.cn,
  ]).map((keyword) => ({ keyword, url: buildAdLibraryUrl(keyword) }));

  // 검색어 중복 제거
  const seen = new Set<string>();
  return [...areaQs, ...generalQs].filter((q) => {
    if (seen.has(q.keyword)) return false;
    seen.add(q.keyword);
    return true;
  });
}

/** 검색 URL/본문 텍스트에서 지역(권역) 판별 */
export function areaFromText(text: string): Area | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const area of Object.keys(AREA_TERMS) as Area[]) {
    if (
      AREA_TERMS[area].some(
        (t) =>
          text.includes(t) ||
          text.includes(encodeURIComponent(t)) ||
          lower.includes(t.toLowerCase())
      )
    ) {
      return area;
    }
  }
  return null;
}
