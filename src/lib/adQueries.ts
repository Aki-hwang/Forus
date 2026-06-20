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
    jp: ["江南 皮膚科", "狎鴎亭 皮膚科", "新沙 美容クリニック", "清潭 クリニック"],
    kr: ["강남 피부과", "역삼 피부과", "강남 리프팅"],
    cn: ["江南 皮肤科", "清潭 医美"],
  },
  명동: {
    jp: ["明洞 皮膚科", "明洞 美容皮膚科", "乙支路 皮膚科"],
    kr: ["명동 피부과", "충무로 피부과"],
    cn: ["明洞 皮肤科", "明洞 医美", "明洞 注射美容"],
  },
  홍대: {
    jp: ["弘大 皮膚科", "ホンデ 美容クリニック", "合井 皮膚科", "ホンデ 皮膚科"],
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

// 언어별 광고 "송출 국가" — 한국 클리닉의 외국인 타겟 광고는 현지(타겟국) 송출이 많다.
//   일본인 타겟: 한국(방한 일본인) + 일본(방한 전 일본 거주자에게 노출) → KR·JP 둘 다 검색
//   중국인 타겟: 한국 + 대만(번체 중화권·Meta 사용) → KR·TW   ※ 중국 본토는 Meta 미사용
//   한국인 타겟: 한국만
// country=KR 만 검색하면 "일본에서 송출되는" 한국 클리닉의 일본어 광고를 통째로 놓친다.
const LANG_COUNTRIES: Record<keyof LangQueries, string[]> = {
  jp: ["KR", "JP"],
  kr: ["KR"],
  cn: ["KR", "TW"],
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

/** 검색어 + 송출국가로 광고 라이브러리 검색 URL 생성
 *  country — 광고가 송출된 국가(KR/JP/TW…). 일본 송출 광고를 잡으려면 JP 로 검색해야 한다.
 *  start_date[min] — 최근 30일 이내 시작 광고만 서버단에서 사전 필터링.
 *  30일 초과 광고는 클라이언트 측 MAX_ACTIVE_DAYS 로도 한 번 더 걸러낸다. */
export function buildAdLibraryUrl(keyword: string, country = "KR"): string {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    active_status: "active",
    ad_type: "all",
    country,
    is_targeted_country: "false",
    media_type: "all",
    q: keyword,
    search_type: "keyword_unordered",
    "sort_data[direction]": "desc",
    "sort_data[mode]": "total_impressions",
  });
  params.set("start_date[min]", thirtyDaysAgo);
  return `${AD_LIBRARY_BASE}?${params.toString()}`;
}

export interface SearchQuery {
  /** 지역이 확정된 검색이면 지역, 일반 검색이면 undefined */
  area?: Area;
  /** 광고 송출 국가 (KR/JP/TW) — 액터 입력에도 전달 */
  country: string;
  /** 검색어 언어 — 결과 본문이 한자만이라 모호할 때 언어 추론 힌트로 사용 */
  lang: keyof LangQueries;
  keyword: string;
  url: string;
}

/**
 * 이번 수집의 전체 검색 쿼리 — 지역(권역)별 KR·JP·CN + 일반(시술) 검색어를, 각 언어의
 * "송출국가"(LANG_COUNTRIES)로 확장해 "모두" 훑는다. 일본인 타겟 광고는 한국(KR)뿐 아니라
 * 일본(JP) 송출분까지 검색해야 누락이 없다. 주차 로테이션 없이 매 수집마다 전부 실행.
 *   지역: 강남(JP4+KR3+CN2)+명동(JP3+KR2+CN3)+홍대(JP4+KR2+CN2) × (JP·CN은 2개국, KR 1개국)
 *   일반(시술): JP4+KR1+CN3 도 동일하게 송출국가로 확장.
 *   URL에 start_date[min]=(30일전)을 붙여 최근 30일 광고만 서버단에서 사전 필터링.
 *   결과는 7일 캐시. 수집량/속도는 APIFY_PER_QUERY·APIFY_CONCURRENCY 로 조절.
 *
 *   순서는 (언어 × 송출국가 × 권역) 라운드로빈으로 인터리브한다 — APIFY_COLLECT_MS 예산에
 *   잘려 일부만 실행돼도 JP(KR·JP 송출)·권역이 앞쪽부터 고루 섞이도록(일본인 광고 우선 확보).
 */
export function searchQueries(): SearchQuery[] {
  const areas = Object.keys(AREA_QUERIES) as Area[];
  const langs: (keyof LangQueries)[] = ["jp", "kr", "cn"];

  // (언어 × 송출국가 × 권역) + (언어 × 송출국가 × 일반) 스트림. 라운드로빈으로 앞쪽부터 골고루.
  type Stream = { area?: Area; country: string; lang: keyof LangQueries; words: string[] };
  const streams: Stream[] = [];
  for (const lang of langs) {
    for (const country of LANG_COUNTRIES[lang]) {
      for (const area of areas) {
        streams.push({ area, country, lang, words: AREA_QUERIES[area][lang] });
      }
    }
  }
  for (const lang of langs) {
    for (const country of LANG_COUNTRIES[lang]) {
      streams.push({ country, lang, words: GENERAL_QUERIES[lang] });
    }
  }

  // 라운드로빈 인터리브 + (검색어,국가) 중복 제거
  const out: SearchQuery[] = [];
  const seen = new Set<string>();
  const maxLen = Math.max(0, ...streams.map((s) => s.words.length));
  for (let i = 0; i < maxLen; i++) {
    for (const s of streams) {
      const keyword = s.words[i];
      if (!keyword) continue;
      const dedup = `${keyword}|${s.country}`;
      if (seen.has(dedup)) continue;
      seen.add(dedup);
      out.push({
        area: s.area,
        country: s.country,
        lang: s.lang,
        keyword,
        url: buildAdLibraryUrl(keyword, s.country),
      });
    }
  }
  return out;
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
