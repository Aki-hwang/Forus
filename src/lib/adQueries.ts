// Meta(페이스북) 광고 라이브러리 수집용 검색어 설정 (일본인 타겟)
//
// - 지역 키워드: 江南/明洞/ホンデ 가 들어가 지역이 확실 → 매주 지역당 1개 로테이션
// - 일반/시술 키워드: 지역이 없는 일본어 검색어 → 매주 GENERAL_PER_WEEK 개씩 로테이션
//   (주 1회 검색어 변경). 이 광고들의 지역은 본문에서 추론, 없으면 강남 기본.
//
// 출처: 운영 Notion "인스타그램 검색 키워드".

import { Area } from "./ads";

// 강남은 압구정·청담·신사(지리적으로 강남 권역)까지 포함해 커버리지를 넓힘
const AREA_QUERIES: Record<Area, string[]> = {
  강남: [
    "江南 美容クリニック",
    "狎鴎亭 美容クリニック",
    "清潭 皮膚科 日本語",
    "新沙 美容クリニック",
    "江南 日本語 クリニック",
    "韓国プチ整形 江南",
  ],
  명동: ["明洞 美容クリニック 日本人", "明洞 スキンケア クリニック"],
  홍대: ["ホンデ 皮膚科 日本語", "ホンデ 韓国美容"],
};

// 지역별 매주 검색 개수 (강남은 시장이 가장 커 2개)
const AREA_PICKS: Record<Area, number> = { 강남: 2, 명동: 1, 홍대: 1 };

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

/** 한국(국내) 타겟 한국어 검색 키워드 — 한국 타겟 탭용 */
const KR_QUERIES: string[] = [
  "강남 피부과 이벤트",
  "압구정 피부과",
  "명동 피부과",
  "홍대 피부과",
  "물광주사 이벤트",
  "리프팅 이벤트",
  "보톡스 이벤트",
  "피부과 시술 이벤트",
];

/** 매주 사용할 일반 키워드 개수 (지역 + 일반 + 한국어 = 주당 검색 수) */
const GENERAL_PER_WEEK = 2;
const KR_PER_WEEK = 2;

/** 지역 판별용 표기 (검색 URL/본문 모두에서 탐지) */
const AREA_TERMS: Record<Area, string[]> = {
  // 강남 권역: 압구정·청담·신사 포함
  강남: ["江南", "カンナム", "강남", "gangnam", "狎鴎亭", "압구정", "アックジョン", "清潭", "청담", "チョンダム", "新沙", "신사", "シンサ"],
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

  const areaQs: SearchQuery[] = (Object.keys(AREA_QUERIES) as Area[]).flatMap((area) => {
    const list = AREA_QUERIES[area];
    const picks = AREA_PICKS[area] ?? 1;
    return Array.from({ length: picks }, (_, j) => {
      const keyword = list[(w * picks + j) % list.length];
      return { area, keyword, url: buildAdLibraryUrl(keyword) };
    });
  });

  const generalQs: SearchQuery[] = [];
  for (let i = 0; i < GENERAL_PER_WEEK; i++) {
    const keyword = GENERAL_QUERIES[(w * GENERAL_PER_WEEK + i) % GENERAL_QUERIES.length];
    generalQs.push({ keyword, url: buildAdLibraryUrl(keyword) });
  }

  const krQs: SearchQuery[] = [];
  for (let i = 0; i < KR_PER_WEEK; i++) {
    const keyword = KR_QUERIES[(w * KR_PER_WEEK + i) % KR_QUERIES.length];
    krQs.push({ keyword, url: buildAdLibraryUrl(keyword) });
  }

  return [...areaQs, ...generalQs, ...krQs];
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
