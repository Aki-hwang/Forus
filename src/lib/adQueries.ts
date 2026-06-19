// Meta(페이스북) 광고 라이브러리 수집용 지역별 검색어 설정
//
// 주 1회(ISO 주차 기준) 검색어를 로테이션하며 재수집한다.
// 키워드는 일본인 타겟 표기(CJK)를 우선으로 한다. (예: 江南美容皮膚科)
// 추후 중국어/한국어 키워드를 배열에 추가하면 자동으로 로테이션에 포함된다.

import { Area } from "./ads";

const QUERIES: Record<Area, string[]> = {
  강남: ["江南美容皮膚科", "江南皮膚科", "江南美容クリニック", "江南美容外科"],
  명동: ["明洞美容皮膚科", "明洞皮膚科", "明洞美容クリニック"],
  홍대: ["弘大美容皮膚科", "弘大皮膚科", "ホンデ皮膚科"],
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

/** 이번 주에 사용할 지역별 검색어 (주차 % 키워드수) */
export function currentKeyword(area: Area, now: Date = new Date()): string {
  const list = QUERIES[area];
  return list[isoWeek(now) % list.length];
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

export interface AreaQuery {
  area: Area;
  keyword: string;
  url: string;
}

/** 이번 주 3개 지역 검색 쿼리 */
export function weeklyAreaQueries(now: Date = new Date()): AreaQuery[] {
  return (Object.keys(QUERIES) as Area[]).map((area) => {
    const keyword = currentKeyword(area, now);
    return { area, keyword, url: buildAdLibraryUrl(keyword) };
  });
}

/** 결과 항목의 검색 URL/텍스트에서 어느 지역 검색이었는지 역매핑 */
export function areaFromText(text: string): Area | null {
  if (!text) return null;
  for (const area of Object.keys(QUERIES) as Area[]) {
    if (
      QUERIES[area].some(
        (k) => text.includes(k) || text.includes(encodeURIComponent(k))
      )
    ) {
      return area;
    }
  }
  return null;
}
