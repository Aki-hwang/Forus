// Meta(페이스북) 광고 라이브러리 수집용 검색어 설정 (일본인 타겟)
//
// - 지역 키워드: 江南/明洞/ホンデ 가 들어가 지역이 확실 → 매주 지역당 1개 로테이션
// - 일반/시술 키워드: 지역이 없는 일본어 검색어 → 매주 GENERAL_PER_WEEK 개씩 로테이션
//   (주 1회 검색어 변경). 이 광고들의 지역은 본문에서 추론, 없으면 강남 기본.
//
// 출처: 운영 Notion "인스타그램 검색 키워드".

import { Area } from "./ads";

const AREA_QUERIES: Record<Area, string[]> = {
  강남: ["江南 美容クリニック", "江南 日本語 クリニック", "韓国プチ整形 江南"],
  명동: ["明洞 美容クリニック 日本人", "明洞 スキンケア クリニック"],
  홍대: ["ホンデ 皮膚科 日本語", "ホンデ 韓国美容"],
};

const GENERAL_QUERIES: string[] = [
  "韓国リジュラン サーモン注射",
  "韓国スキンブースター 日本人",
  "韓国ボトックス おすすめ",
  "韓国フィラー クリニック",
  "韓国スレッドリフト 糸リフト",
  "韓国リフティング ウルセラ",
  "韓国美容注射 リフトアップ",
  "韓国レーザー 美肌",
  "韓国クリニック 日本語対応",
  "韓国皮膚科 日本人向け",
  "韓国美容 日本人向け",
  "ソウル 美容 日本語対応",
  "韓国美容旅行 クリニック",
];

/** 매주 사용할 일반 키워드 개수 (지역 3개 + 일반 N개 = 주당 검색 수) */
const GENERAL_PER_WEEK = 2;

/** 지역 판별용 표기 (검색 URL/본문 모두에서 탐지) */
const AREA_TERMS: Record<Area, string[]> = {
  강남: ["江南", "カンナム", "강남", "gangnam"],
  명동: ["明洞", "ミョンドン", "명동", "myeongdong", "myeong-dong"],
  홍대: ["弘大", "ホンデ", "홍대", "hongdae", "hong-dae"],
};

const AD_LIBRARY_BASE = "https://www.facebook.com/ads/library/";

/** ISO 8601 주차 (월요일 시작) */
function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

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

/** 이번 주 검색 쿼리: 지역 3개(각 1) + 일반 GENERAL_PER_WEEK 개 (주차 기준 로테이션) */
export function weeklyQueries(now: Date = new Date()): SearchQuery[] {
  const w = isoWeek(now);

  const areaQs: SearchQuery[] = (Object.keys(AREA_QUERIES) as Area[]).map((area) => {
    const list = AREA_QUERIES[area];
    const keyword = list[w % list.length];
    return { area, keyword, url: buildAdLibraryUrl(keyword) };
  });

  const generalQs: SearchQuery[] = [];
  for (let i = 0; i < GENERAL_PER_WEEK; i++) {
    const keyword = GENERAL_QUERIES[(w * GENERAL_PER_WEEK + i) % GENERAL_QUERIES.length];
    generalQs.push({ keyword, url: buildAdLibraryUrl(keyword) });
  }

  return [...areaQs, ...generalQs];
}

/** 검색 URL/본문 텍스트에서 지역 판별 */
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
