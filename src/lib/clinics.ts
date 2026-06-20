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
  { name: "리엔장 강남점", handle: "lienjang.japan", areas: ["강남"], followers: "30K", note: "강남 일본어 계정, X·인스타·틱톡·유튜브 운영" },
  { name: "리엔장 홍대점", handle: "lienjang.hongdae_jp", areas: ["홍대"], followers: "", note: "홍대 일본어 계정" },
  // 홍대 권역 (2026-06-20 xlsx 임포트)
  { name: "닥터쁘띠의원 홍대점", handle: "dp_hd_jp", areas: ["홍대"], followers: "", note: "홍대입구역, 일본어 통역 상주, LINE 문의" },
  { name: "제이필클리닉 홍대점", handle: "jfeelclinic_jp", areas: ["홍대"], followers: "", note: "홍대입구역 8번 출구 직결, 일본어 계정, LINE" },
  { name: "프로젝트유의원 홍대", handle: "projectu_jp", areas: ["홍대"], followers: "", note: "홍대, 일본어 계정, 실리프팅·필러 특화" },
  { name: "셀린클리닉 홍대점", handle: "cellin_hongdae", areas: ["홍대"], followers: "", note: "홍대, 일본어 LINE 전환, 日本語対応" },
  { name: "아비쥬의원 홍대", handle: "abijouclinic", areas: ["홍대"], followers: "", note: "홍대 글로벌센터, 다국어 통역" },
  { name: "리엘르의원 홍대본점", handle: "reele_clinic_hongdae", areas: ["홍대"], followers: "", note: "홍대·신촌, LINE 고객센터" },
  { name: "뷰티블라썸의원", handle: "beautyblossom_clinic", areas: ["홍대"], followers: "", note: "합정·홍대" },
  { name: "포레나클리닉 홍대", handle: "forenaclinic", areas: ["홍대"], followers: "", note: "홍대, 외국인 후기 콘텐츠" },
  { name: "마인드피부과", handle: "mindskin_clinic", areas: ["홍대"], followers: "", note: "홍대" },
  { name: "아르스킨의원 홍대", handle: "arskin_hongdae", areas: ["홍대"], followers: "", note: "홍대입구역, 리프팅·피부관리" },
  { name: "나인의원 홍대점", handle: "nainskin_hongdae", areas: ["홍대"], followers: "", note: "홍대입구역 2번 출구" },
  { name: "리즈온의원 홍대점", handle: "lizonclinic_hongdae", areas: ["홍대"], followers: "", note: "홍대입구역 9번 출구" },
  { name: "에스리본의원 홍대점", handle: "sreborn_clinic", areas: ["홍대"], followers: "", note: "홍대입구역 8번 출구, 弘大皮膚科 해시태그" },
  // 명동 권역 (2026-06-20 xlsx 임포트)
  { name: "아비쥬의원 명동점", handle: "abijouclinic_md", areas: ["명동"], followers: "", note: "명동/을지로입구, 다국어 통역 글로벌센터" },
  { name: "닥터쁘띠의원 명동점", handle: "dp_md_jp", areas: ["명동"], followers: "", note: "명동/퇴계로, 일본어 전용 계정·LINE" },
  { name: "닥터에버스의원 명동점", handle: "drevers_jp", areas: ["명동"], followers: "", note: "명동/을지로, 일본어 계정·LINE" },
  { name: "셀린클리닉 명동점", handle: "cellinclinic_myeongdong", areas: ["명동"], followers: "", note: "명동/을지로입구, 일본어 LINE, 365일 진료" },
  { name: "명동 아이디의원", handle: "idclinic_md_jp", areas: ["명동"], followers: "", note: "명동/을지로입구, 일본어 공식 계정·LINE" },
  { name: "밴스의원 명동점", handle: "vands_myeongdong_global", areas: ["명동"], followers: "", note: "명동/을지로입구, 일본어·영어 글로벌 계정" },
  { name: "닥터디자이너클리닉 명동점", handle: "drdesigner_md_global", areas: ["명동"], followers: "", note: "명동/을지로입구, 글로벌 계정" },
  { name: "카인드글로벌의원", handle: "kindglobalclinic", areas: ["명동"], followers: "", note: "명동/을지로입구, 한국인 타깃·다국어 국제환자 대응" },
  // 오테나의원: 핸들 미확인 → CLINIC_ALLOWLIST로 광고 보호, 핸들 확인 후 재등록
  { name: "톡스앤필 명동점", handle: "myeongdong_toxnfill", areas: ["명동"], followers: "", note: "명동/을지로입구, 다국어 사이트·LINE" },
  { name: "리엔장의원 명동점", handle: "lienjang.md_jp", areas: ["명동"], followers: "", note: "명동/눈스퀘어, 일본어 계정·외국인 타깃" },
  { name: "우미클리닉 명동", handle: "umi_clinic__jp", areas: ["명동"], followers: "", note: "명동/을지로입구, 일본어 계정·블로그·LINE" },
  { name: "BLS클리닉 명동점", handle: "blsclinic_eng", areas: ["명동"], followers: "", note: "명동역, 영문 계정·일본어 통역" },
  { name: "데이뷰의원 명동더프리미엄점", handle: "daybeaumd_luxe_global", areas: ["명동"], followers: "", note: "명동/을지로입구, 프리미엄·야간진료" },
  { name: "리진의원 명동", handle: "lijinclinic_jpn", areas: ["명동"], followers: "", note: "명동역 인근, 일본어 계정" },
  { name: "리베리의원 명동점", handle: "reberrymd_en", areas: ["명동"], followers: "", note: "명동역, 영문 계정" },
  { name: "메이의원 명동", handle: "mayclinic_official", areas: ["명동"], followers: "", note: "명동역, 영문·LINE·WhatsApp·Kakao" },
  { name: "카린의원 명동", handle: "karinclinic_eng", areas: ["명동"], followers: "", note: "명동, 영문 글로벌 계정" },
  { name: "클리암클리닉 글로벌", handle: "kleam_clinic_global", areas: ["명동"], followers: "", note: "명동 프리미엄 지점, 글로벌 계정" },
  { name: "벤자민피부과 명동", handle: "benjaminclinic_en", areas: ["명동"], followers: "", note: "명동, 피부과 전문의·영문 계정" },
  // 강남 권역 (2026-06-20 xlsx 임포트) — 핸들 확정된 곳만 등록, 나머지는 ALLOWLIST 로 보호
  { name: "샤인빔의원 강남", handle: "shinebeam_gangnam", areas: ["강남"], followers: "", note: "강남역, 일본어 계정·LINE @shinebeam" },
  { name: "닥터스피부과 신사점", handle: "doctors_jp", areas: ["강남"], followers: "", note: "신사역/가로수길, 일본어 계정" },
  { name: "밴스클리닉 신사점", handle: "vands_sinsa.jp", areas: ["강남"], followers: "", note: "신사역, 일본어 계정" },
  { name: "VS라인클리닉 압구정", handle: "vslineclinic", areas: ["강남"], followers: "", note: "압구정, 일본어 단서" },
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
  "terapia",
  "sisterann_official",
  "sisterann",
  "ogeasai",
]);
const BLOCKED_NAME_PARTS = [
  "beaund",
  "ecombz",
  "electr",
  "강남언니",
  "gangnamunni",
  "연모비",
  "yeonmovi",
  "terapia",
  "테라피아",
  "melable",
  "꿀피부",
  "저장소",
  "쇼핑",
  "스토어",
  "store",
  "sisterann",
  "시스터앤",
  "ogeasai",
  "ógeasaí",
];

export function isBlockedAdvertiser(igUsername?: string, pageName?: string): boolean {
  const h = igUsername?.replace(/^@/, "").trim().toLowerCase() ?? "";
  const n = (pageName ?? "").toLowerCase();
  if (h && BLOCKED_HANDLES.has(h)) return true;
  return BLOCKED_NAME_PARTS.some((p) => h.includes(p) || n.includes(p));
}

// ---------- 클리닉 판별 / 잡광고 필터 ----------
// 우선순위: ① 등록·허용 클리닉이면 무조건 유지 → ② 차단목록이면 제외 →
//   ③ 클리닉 신호 있으면 유지 → ④ 잡광고 신호 있으면 제외 → ⑤ 애매하면 유지(클리닉 손실 방지)

// 브랜드명에 병원/클리닉 단어가 없어도 실제 클리닉인 곳(항상 유지)
const CLINIC_ALLOWLIST = [
  "유앤아이", "톡스앤필", "toxnfill", "블리비", "velyb", "쁨", "ppeum",
  "리엔장", "lienjang", "daybeau", "celliday", "idclinic", "diore",
  "vellicell", "cellin", "theclim", "slimyoung", "wooa", "mayclinic",
  "오블리주", "ohvelyjoo", "arskin", "forteclinic", "drdesigner", "doctorpetit",
  // 홍대 권역 추가 (2026-06-20)
  "dp_hd_jp", "닥터쁘띠", "jfeelclinic", "제이필", "projectu", "프로젝트유",
  "reele", "리엘르", "beautyblossom", "뷰티블라썸", "forenaclinic", "포레나",
  "mindskin", "nainskin", "나인의원", "lizonclinic", "리즈온", "sreborn", "에스리본",
  "abijou", "아비쥬",
  // 명동 권역 추가 (2026-06-20)
  "drevers", "에버스", "vands", "밴스", "kindglobal", "카인드글로벌", "otena", "오테나",
  "umi_clinic", "우미클리닉", "blsclinic", "lijinclinic", "리진의원", "reberry", "리베리",
  "karinclinic", "카린의원", "kleam", "클리암", "benjamin", "벤자민",
  // 강남 권역 추가 (2026-06-20) — 핸들/브랜드명으로 보호
  "shinebeam", "샤인빔", "doctors_jp", "닥터스피부과", "vsline", "vs라인",
  "바로그", "누와", "레픽", "오션클리닉", "포엔", "엔젤미", "룬피부과", "루아브",
  "오엔의원", "연세라인", "메이린", "오가나셀", "oganacell", "그로브원", "groveone",
  "소유클리닉", "미앤미", "테시토", "베일러", "bailor", "leecrew", "louave",
  "verme", "uline", "theheal", "dewy.d", "ppangclinic", "빵클리닉",
];

const CLINIC_SIGNALS = [
  "의원", "클리닉", "피부과", "성형외과", "병원", "의료", "의료진", "원장", "전문의",
  "clinic", "clinique", "derma",
  "皮膚科", "美容外科", "美容皮膚科", "整形", "クリニック",
  "診所", "醫院", "醫美", "医院", "医美", "诊所",
];

// 클리닉 신호가 없을 때만 적용 — 화장품/제품·인플루언서·대행사·여행 등 잡광고
const NON_CLINIC_SIGNALS = [
  // 제품/화장품
  "크림", "세럼", "앰플", "에센스", "토너", "로션", "클렌저", "클렌징", "마스크팩",
  "콜라겐", "영양제", "화장품", "1+1", "증정", "완판", "품절", "재입고", "정기구독",
  "리필", "진리템", "약국", "무료배송", "홈케어",
  "쿠션", "파운데이션", "틴트", "립밤", "향수", "샴푸", "바디로션", "선크림", "선블럭",
  "팩트", "코스메틱", "cosmetic", "스킨케어세트", "기초세트", "본품", "구성", "용량",
  "더마코스메틱", "코스메슈티컬", "cosmeceutical", "마스크시트", "시트마스크",
  "리들샷", "홈케어디바이스", "뷰티디바이스", "홈뷰티", "패치세트",
  // 인플루언서/제휴/블로그
  "꿀팁", "뷰티공간", "뷰티로그", "beautylog", "dailybeauty", "리뷰왕", "리뷰맨",
  "내돈내산", "공구", "협찬", "정보 공유", "저장소", "연구소", "비결",
  // 마케팅 대행/미디어
  "마케팅", "상위노출", "대행", "미디어랩", "광고대행",
  // 여행/숙소
  "숙소", "휴가", "여행",
  // 기기/디바이스
  "디바이스",
];

const ALLOW_PARTS = CLINIC_ALLOWLIST.map((s) => s.toLowerCase());

// Meta 페이지 카테고리 기반 판별 (가장 신뢰도 높은 1차 신호)
// 의료 카테고리 = 확실한 클리닉 / 비클리닉 카테고리 = 확실한 제외
const MEDICAL_CATEGORIES = [
  "medical & health", "medical service", "medical company", "hospital", "doctor",
  "dermatolog", "surgeon", "plastic surgeon", "clinic",
  "의료", "병원", "의원", "피부과", "성형외과", "医療", "醫療", "皮膚科", "病院",
];
const NON_CLINIC_CATEGORIES = [
  "blogger", "personal blog", "blog", "video creator", "digital creator", "influencer",
  "marketing agency", "advertising", "media", "product/service", "shopping",
  "retail", "e-commerce", "cosmetics", "health/beauty store", "travel",
  "personal goods", "brand", "clothing",
  "beauty, cosmetic & personal care", "beauty supply store", "cosmetics store",
  "makeup artist", "perfume",
  "블로그", "쇼핑", "마케팅", "화장품", "여행", "크리에이터",
];

function categoryMatch(cat: string | undefined, list: string[]): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return list.some((s) => c.includes(s));
}

/** Meta 페이지 카테고리가 의료(병원/피부과/성형외과 등)인지 — 의료기관 검증의 양성 신호 */
export function isMedicalCategory(pageCategory?: string): boolean {
  return categoryMatch(pageCategory, MEDICAL_CATEGORIES);
}

/** 광고를 피드에서 제외할지 (true = 제외). pageCategory(있으면) 우선. */
export function isExcludedAd(
  igUsername?: string,
  name?: string,
  text?: string,
  pageCategory?: string
): boolean {
  const id = `${igUsername ?? ""} ${name ?? ""}`.toLowerCase();
  if (ALLOW_PARTS.some((p) => id.includes(p))) return false; // 허용 클리닉 → 유지
  if (isBlockedAdvertiser(igUsername, name)) return true; // 차단목록 → 제외

  // ① Meta 카테고리 (가장 정확)
  if (categoryMatch(pageCategory, MEDICAL_CATEGORIES)) return false; // 의료 → 유지
  if (categoryMatch(pageCategory, NON_CLINIC_CATEGORIES)) return true; // 비클리닉 → 제외

  // ② 텍스트 신호 (카테고리가 없거나 'Health/beauty'처럼 애매할 때)
  const t = `${name ?? ""} ${text ?? ""}`.toLowerCase();
  if (CLINIC_SIGNALS.some((s) => t.includes(s.toLowerCase()))) return false; // 클리닉 신호 → 유지
  if (NON_CLINIC_SIGNALS.some((s) => t.includes(s.toLowerCase()))) return true; // 잡광고 → 제외
  return false; // 애매 → 유지
}
