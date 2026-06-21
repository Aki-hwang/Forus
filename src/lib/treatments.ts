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

/** 시술 분류 — 키워드 매칭. 안 잡히면 null(미분류). */
export function classifyTreatment(text: string): TreatmentKey | null {
  const lower = (text || "").toLowerCase();
  for (const key of Object.keys(TREATMENT_KEYWORDS) as TreatmentKey[]) {
    if (TREATMENT_KEYWORDS[key].some((kw) => lower.includes(kw.toLowerCase()))) return key;
  }
  return null;
}
