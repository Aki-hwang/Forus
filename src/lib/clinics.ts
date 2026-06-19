// Apify 인스타 수집 대상 클리닉 계정 설정
// 여기 등록된 계정들의 "최신 게시물"을 Apify Instagram 스크래퍼로 긁어
// src/lib/apify.ts 에서 Ad 모델로 매핑합니다.
//
// username 은 인스타 핸들(@ 제외). area/clinic 은 매핑용 메타데이터,
// fallbackTreatment 는 캡션에서 시술을 추론하지 못했을 때 쓰는 기본값입니다.
//
// ⚠️ 아래는 강남·명동·홍대 타겟 예시 계정 목록입니다. 실제 운영 시
//    수집하고 싶은 클리닉 핸들로 교체하세요.

import { Area, TreatmentKey } from "./ads";

export interface ClinicAccount {
  username: string;
  clinic: string;
  area: Area;
  fallbackTreatment: TreatmentKey;
}

export const CLINIC_ACCOUNTS: ClinicAccount[] = [
  // 강남
  { username: "raon_derma", clinic: "라온 피부과", area: "강남", fallbackTreatment: "물광주사" },
  { username: "celline_clinic", clinic: "셀린 의원", area: "강남", fallbackTreatment: "리프팅" },
  { username: "premia_ps", clinic: "프리미아 성형외과", area: "강남", fallbackTreatment: "보톡스" },
  // 명동
  { username: "muse_clinic_md", clinic: "뮤즈 클리닉", area: "명동", fallbackTreatment: "미백토닝" },
  { username: "belle_clinic_md", clinic: "벨르 클리닉", area: "명동", fallbackTreatment: "필러" },
  // 홍대
  { username: "ontteul_derma", clinic: "온뜰 피부과", area: "홍대", fallbackTreatment: "모공여드름" },
  { username: "glowlab_hongdae", clinic: "글로우랩", area: "홍대", fallbackTreatment: "스킨부스터" },
];

/** 환경변수로 수집 대상 핸들을 덮어쓸 수 있게 (콤마 구분). 메타데이터는 알 수 없으므로 강남/물광 기본값 사용. */
export function resolveClinicAccounts(): ClinicAccount[] {
  const override = process.env.APIFY_IG_PROFILES?.trim();
  if (!override) return CLINIC_ACCOUNTS;

  return override
    .split(",")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((username) => {
      const known = CLINIC_ACCOUNTS.find((c) => c.username === username);
      if (known) return known;
      return {
        username,
        clinic: `@${username}`,
        area: "강남" as Area,
        fallbackTreatment: "물광주사" as TreatmentKey,
      };
    });
}

export function findClinic(username: string): ClinicAccount | undefined {
  const u = username?.toLowerCase();
  return CLINIC_ACCOUNTS.find((c) => c.username.toLowerCase() === u);
}
