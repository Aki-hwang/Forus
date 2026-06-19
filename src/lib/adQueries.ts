// Meta(페이스북) 광고 라이브러리 수집용 검색어 설정 (일본인·한국인·중국인 타겟)
//
// - 지역 키워드: 江南/明洞/弘大(ホンデ) 가 들어가 지역이 확실 → 매주 지역당 로테이션
// - 일반/시술 키워드: 지역이 없는 검색어 → 매주 GENERAL_PER_WEEK(_CN) 개씩 로테이션
//   (주 1회 검색어 변경). 이 광고들의 지역은 본문에서 추론, 없으면 강남 기본.
// - 언어는 광고 본문에서 추론(apify.ts inferLang)하므로, 검색어 언어 = 결과 언어가
//   항상 일치하진 않는다. 검색어는 "그 언어권 광고가 걸릴 확률"을 높이는 용도.
//
// 출처: 운영 Notion "인스타그램 검색 키워드".

import { Area } from "./ads";

// 지역별 일본어(JP) 검색어 — 강남은 압구정·청담·신사(강남 권역) 포함
const AREA_QUERIES_JP: Record<Area, string[]> = {
  강남: ["江南 皮膚科", "江南 美容クリニック", "江南 日本語 クリニック", "韓国プチ整形 江南", "狎鴎亭 皮膚科", "清潭 皮膚科", "新沙 美容クリニック"],
  명동: ["明洞 皮膚科", "明洞 美容クリニック 日本人", "明洞 スキンケア クリニック", "明洞 美容クリニック"],
  홍대: ["弘大 皮膚科", "ホンデ 皮膚科 日本語", "ホンデ 韓国美容", "ホンデ 美容クリニック"],
};

// 지역별 한국어(KR) 검색어 — 한국 타겟 탭이 지역별로 채워지도록 매주 검색
const AREA_QUERIES_KR: Record<Area, string[]> = {
  강남: ["강남 피부과", "압구정 피부과", "청담 피부과", "신사 피부과", "강남 피부과 이벤트"],
  명동: ["명동 피부과", "명동 피부과 이벤트", "명동 피부과 외국인"],
  홍대: ["홍대 피부과", "홍대 피부과 이벤트", "홍대 피부과 리프팅"],
};

// 지역별 중국어(CN) 검색어 — 중국인 타겟 탭이 채워지도록 매주 1개 로테이션
const AREA_QUERIES_CN: Record<Area, string[]> = {
  강남: ["江南 整形医院", "狎鸥亭 皮肤科", "清潭洞 医美", "江南 皮肤管理 中文"],
  명동: ["明洞 皮肤科 中文", "明洞 医美", "明洞 皮肤管理 中文"],
  홍대: ["弘大 皮肤科 中文", "弘大 医美", "弘大 皮肤管理 中文"],
};

// 지역 없는 일반(일본어) 검색어 — 매주 GENERAL_PER_WEEK 개 로테이션
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
  "韓国水光注射 日本人",
  "韓国シミ取り レーザー",
  "韓国毛穴治療 クリニック",
  "韓国ハイフ リフトアップ",
  "韓国美容皮膚科 日本語",
  "韓国美容 日本人向け",
  "ソウル 美容 日本語対応",
  "韓国美容旅行 クリニック",
];

// 지역 없는 일반(중국어) 검색어 — 매주 GENERAL_PER_WEEK_CN 개 로테이션
const GENERAL_QUERIES_CN: string[] = [
  "韩国水光针",
  "韩国肉毒 瘦脸针",
  "韩国玻尿酸 填充",
  "韩国线雕 提升",
  "韩国皮肤管理 中文",
  "韩国医美 中文",
  "韩国整形医院 中文对应",
  "韩国皮肤科 中文",
];

const GENERAL_PER_WEEK = 2;
const GENERAL_PER_WEEK_CN = 1;

/** 지역 판별용 표기 (검색 URL/본문 모두에서 탐지) — JP 한자/CN 간체 표기 모두 포함 */
const AREA_TERMS: Record<Area, string[]> = {
  // 강남 권역: 압구정·청담·신사 포함 (狎鴎亭=JP, 狎鸥亭=CN 간체)
  강남: ["江南", "カンナム", "강남", "gangnam", "狎鴎亭", "狎鸥亭", "압구정", "アックジョン", "清潭", "청담", "チョンダム", "新沙", "신사", "シンサ"],
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

/**
 * 이번 주 검색 쿼리 (주차 기준 로테이션):
 *   지역(3) × [ JP 2 + KR 1 + CN 1 ] + 일반 JP 2 + 일반 CN 1  ≈ 주당 15개 검색.
 *   Notion "인스타그램 검색 키워드"(시술별·지역별)를 풀에 모두 포함해 매주 로테이션.
 *   결과는 7일 캐시(APIFY_TTL_SECONDS)되어 주 1회만 실제 수집.
 *   수집량을 더 키우려면 검색당 상한 APIFY_PER_QUERY(기본 60) 를 올린다.
 */
export function weeklyQueries(now: Date = new Date()): SearchQuery[] {
  const w = isoWeek(now);

  // 각 지역마다 매주 JP 2 + KR 1 + CN 1 (언어별 풀에서 주차 로테이션)
  const areaQs: SearchQuery[] = (Object.keys(AREA_QUERIES_JP) as Area[]).flatMap((area) => {
    const jp = AREA_QUERIES_JP[area];
    const kr = AREA_QUERIES_KR[area];
    const cn = AREA_QUERIES_CN[area];
    const picks = [jp[w % jp.length], jp[(w + 1) % jp.length], kr[w % kr.length], cn[w % cn.length]];
    return Array.from(new Set(picks)).map((keyword) => ({ area, keyword, url: buildAdLibraryUrl(keyword) }));
  });

  const generalQs: SearchQuery[] = [];
  for (let i = 0; i < GENERAL_PER_WEEK; i++) {
    const keyword = GENERAL_QUERIES[(w * GENERAL_PER_WEEK + i) % GENERAL_QUERIES.length];
    generalQs.push({ keyword, url: buildAdLibraryUrl(keyword) });
  }
  for (let i = 0; i < GENERAL_PER_WEEK_CN; i++) {
    const keyword = GENERAL_QUERIES_CN[(w * GENERAL_PER_WEEK_CN + i) % GENERAL_QUERIES_CN.length];
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
