// 시술 분류 사전 + 분류기 (서버 수집·클라이언트 집계 공용)
import { TreatmentKey } from "./ads";

export const TREATMENT_KEYWORDS: Record<TreatmentKey, string[]> = {
  물광주사: ["물광", "水光", "水光注射", "水光针", "글로우주사", "skinglow", "글로우"],
  리프팅: ["리프팅", "リフティング", "提升", "线雕", "線雕", "ulthera", "울쎄라", "슈링크", "shurink", "lift", "hifu", "超聲", "超声", "vライン", "v脸", "拉提", "실리프팅"],
  보톡스: ["보톡스", "ボトックス", "肉毒", "瘦脸针", "瘦臉", "botox", "사각턱", "エラ"],
  필러: ["필러", "フィラー", "玻尿酸", "ヒアルロン酸", "filler", "히알루론"],
  미백토닝: ["미백", "토닝", "美白", "トーニング", "调理", "提亮", "toning", "whitening", "레이저토닝", "잡티", "シミ", "美白肌"],
  모공여드름: ["모공", "여드름", "毛穴", "ニキビ", "毛孔", "祛痘", "痘", "暗瘡", "pore", "acne", "트러블", "흉터"],
  스킨부스터: ["스킨부스터", "スキンブースター", "肤质", "膚質", "booster", "리쥬란", "rejuran", "인모드", "juvelook", "쥬베룩", "ブースター"],
};

export const DEFAULT_TREATMENT: TreatmentKey = "물광주사";

/**
 * "확신 분류" — 저장된 treatment 는 키워드가 안 잡히면 기본값(물광주사)이 박히므로,
 * 카드 배지·소비자 시술별 목록처럼 "진짜 그 시술"이어야 하는 곳은 이걸로 재확인한다.
 *  ① 수집 때 저장한 treatmentSure 플래그가 있으면 그대로 신뢰(원문 전체+원본 태그로 판정된 값).
 *  ② 레거시(플래그 없음)는 캡션 + "주입분(기본값 파생 태그)을 뺀" 원본 해시태그로 재판정.
 *     주입 태그(#물광 등)를 그대로 보면 오분류가 다시 확신으로 둔갑하므로 반드시 제외.
 */
export function confidentTreatment(a: {
  caption?: string | null;
  treatment?: TreatmentKey;
  treatmentSure?: boolean;
  hashtags?: string[];
  tags?: string[];
}): TreatmentKey | null {
  if (a.treatmentSure === true && a.treatment) return a.treatment;
  if (a.treatmentSure === false) return null;
  const derived = new Set(["#韓国美容", ...(a.tags ?? []).map((t) => `#${t}`)]);
  const original = (a.hashtags ?? []).filter((h) => !derived.has(h)).join(" ");
  return classifyTreatment(`${a.caption ?? ""} ${original}`);
}

/**
 * 화면에 보여줄 해시태그 — 미분류 게시물은 수집 때 주입된 파생 태그(#韓国美容·#물광 등,
 * 기본값 시술에서 파생 = a.tags)를 걸러 원본 태그만 남긴다. 확신 분류면 저장분 그대로.
 * (기존 저장 데이터 정리용 — 신규 수집분은 애초에 미분류에 파생 태그를 넣지 않는다)
 */
export function displayHashtags(a: {
  caption?: string | null;
  treatment?: TreatmentKey;
  treatmentSure?: boolean;
  hashtags?: string[];
  tags?: string[];
}): string[] {
  const stored = a.hashtags ?? [];
  if (confidentTreatment(a)) {
    return stored.length ? stored : (a.tags ?? []).map((t) => `#${t}`);
  }
  const derived = new Set(["#韓国美容", ...(a.tags ?? []).map((t) => `#${t}`)]);
  return stored.filter((h) => !derived.has(h));
}

/** 시술 분류 — 키워드 매칭. 안 잡히면 null(미분류). */
export function classifyTreatment(text: string): TreatmentKey | null {
  const lower = (text || "").toLowerCase();
  for (const key of Object.keys(TREATMENT_KEYWORDS) as TreatmentKey[]) {
    if (TREATMENT_KEYWORDS[key].some((kw) => lower.includes(kw.toLowerCase()))) return key;
  }
  return null;
}
