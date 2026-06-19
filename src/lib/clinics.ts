// 등록된 일본인 타겟 클리닉 인스타그램 명단 (운영 Notion "일본인 타겟 클리닉 계정 목록")
//
// 수집된 광고의 광고주 인스타 핸들이 이 목록과 일치하면:
//  - 지역이 단일이면 그 지역으로 정밀 매핑
//  - "등록 클리닉" 태그 + 특징 메모 표시
//  - (추후) 2단계 인스타 조회수 수집의 시드로 사용

import { Area } from "./ads";

export interface KnownClinic {
  name: string;
  handle: string; // @ 제외, 소문자
  areas: Area[]; // 우리 3개 지역 중 해당되는 곳 (전국/타지역은 빈 배열)
  followers: string;
  note: string;
}

export const KNOWN_CLINICS: KnownClinic[] = [
  { name: "포르테 클리닉", handle: "forteclinicjpn", areas: ["강남"], followers: "37K", note: "일본인 실장 상주, 리프팅·스킨 특화" },
  { name: "UH CELL 의원", handle: "doctorpetit.gangnam", areas: ["강남"], followers: "37K", note: "일본어 대응, 구 닥터쁘띠" },
  { name: "벤스 클리닉", handle: "yourclinicjp_vands", areas: ["강남", "홍대", "명동"], followers: "46K", note: "다지점, 일본어 전용 운영" },
  { name: "AB클리닉", handle: "abclinicjpn", areas: ["강남"], followers: "1.8K", note: "강남역 5분, 일본어 LINE 대응" },
  { name: "id 미용클리닉", handle: "idclinicjp", areas: ["강남"], followers: "2.6K", note: "윤곽·리프팅 특화, 다국어 대응" },
  { name: "닥터 디자이너 클리닉", handle: "drdesigner_md_jp", areas: ["명동"], followers: "8K", note: "스레드리프트·필러 특화" },
  { name: "블리비의원", handle: "velybclinic", areas: [], followers: "15K", note: "전국 55개 지점, 일본어 계정 별도" },
  { name: "쁨클리닉", handle: "ppeum_clinic_jp", areas: ["강남", "홍대", "명동"], followers: "32K", note: "글로벌점 운영" },
  { name: "오블리주의원", handle: "ohvelyjoo_hongdae_jp", areas: ["홍대"], followers: "4.5K", note: "홍대 위치" },
  { name: "리엔장", handle: "lienjang.japan", areas: ["강남"], followers: "30K", note: "X·인스타·틱톡·유튜브 등 운영중" },
];

const BY_HANDLE = new Map(KNOWN_CLINICS.map((c) => [c.handle.toLowerCase(), c]));

/** 인스타 핸들로 등록 클리닉 조회 (@/대소문자 무시) */
export function findClinicByHandle(handle?: string): KnownClinic | undefined {
  if (!handle) return undefined;
  return BY_HANDLE.get(handle.replace(/^@/, "").trim().toLowerCase());
}

// ---------- 광고주 차단 목록 (피부과 아닌 전자상거래/제품 광고 제외) ----------
// 새로 거슬리는 광고가 보이면 핸들이나 이름 키워드를 여기 추가하면 즉시 제외됩니다.
const BLOCKED_HANDLES = new Set<string>([
  "ecombzzelectronicos",
  "beaund_official",
  "gangnamunni",
  "gangnamunni_official",
  "yeonmovi",
]);
const BLOCKED_NAME_PARTS = [
  "beaund",
  "ecombz",
  "electr",
  "강남언니",
  "gangnamunni",
  "연모비",
  "yeonmovi",
  "쇼핑",
  "스토어",
  "store",
];

export function isBlockedAdvertiser(igUsername?: string, pageName?: string): boolean {
  const h = igUsername?.replace(/^@/, "").trim().toLowerCase() ?? "";
  const n = (pageName ?? "").toLowerCase();
  if (h && BLOCKED_HANDLES.has(h)) return true;
  return BLOCKED_NAME_PARTS.some((p) => h.includes(p) || n.includes(p));
}

// ---------- 화장품/제품 광고 자동 감지 ----------
// 클리닉(병원·시술) 신호가 전혀 없고 제품 판매 신호가 있으면 화장품/제품 광고로 보고 제외.
// 한국어 제품어 기반이라 일본/중국 타겟 클리닉 광고에는 영향이 없음.
const CLINIC_SIGNALS = [
  "의원", "클리닉", "피부과", "성형외과", "병원", "의료", "의료진", "원장", "전문의",
  "시술", "내원", "예약", "상담", "리프팅 시술",
  "clinic", "clinique", "derma",
  "皮膚科", "美容外科", "美容皮膚科", "整形", "クリニック",
  "診所", "醫院", "醫美", "医院", "医美", "诊所",
];
const PRODUCT_SIGNALS = [
  "크림", "세럼", "앰플", "에센스", "토너", "로션", "마스크팩", "마스크 팩", "패드",
  "화장품", "스킨케어 세트", "홈케어", "집에서", "구매", "품절", "배송", "재입고",
  "정기구독", "리필", "세트 구성", "디바이스", "기기", "할인가", "원 구매",
  "바르", "발라", "착용", "입는",
];

export function isProductAd(text: string): boolean {
  const t = (text ?? "").toLowerCase();
  if (CLINIC_SIGNALS.some((s) => t.includes(s.toLowerCase()))) return false;
  return PRODUCT_SIGNALS.some((s) => t.includes(s.toLowerCase()));
}
