// 등록된 일본인 타겟 클리닉 인스타그램 명단 (운영 Notion "일본인 타겟 클리닉 계정 목록")
//
// 수집된 광고의 광고주 인스타 핸들이 이 목록과 일치하면:
//  - 지역이 단일이면 그 지역으로 정밀 매핑
//  - "등록 클리닉" 태그 + 특징 메모 표시
//  - (추후) 2단계 인스타 조회수 수집의 시드로 사용

import { Ad, Area } from "./ads";
import { classifyTreatment } from "./treatments";

/** 유앤아이 상담 채널 허브 — 소비자 UI(gimpo.lineHref)와 클리닉 카드(lineUrl)가 공유하는 단일 출처 */
export const YOUANDI_LINE_URL = "https://linktr.ee/YOUANDI_Clinic";

export interface KnownClinic {
  name: string;
  handle: string; // @ 제외, 소문자
  areas: Area[]; // 우리 3개 지역 중 해당되는 곳 (전국/타지역은 빈 배열)
  followers: string;
  note: string;
  /** LINE 등 상담 채널 직링크 — 있으면 소비자 클리닉 카드에 상담 버튼 노출 */
  lineUrl?: string;
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
  { name: "닥터쁘띠의원 홍대점", handle: "dp_hd_jp", areas: ["홍대"], followers: "", note: "홍대입구역, 일본인 타깃, LINE 문의" },
  { name: "제이필클리닉 홍대점", handle: "jfeelclinic_jp", areas: ["홍대"], followers: "", note: "홍대입구역 8번 출구 직결, 일본어 계정, LINE" },
  { name: "프로젝트유의원 홍대", handle: "projectu_jp", areas: ["홍대"], followers: "", note: "홍대, 일본어 계정, 실리프팅·필러 특화" },
  { name: "셀린의원 홍대점", handle: "cellin_hongdae", areas: ["홍대"], followers: "", note: "홍대, 일본인 타깃, LINE 문의" },
  { name: "아비쥬의원 홍대", handle: "abijouclinic", areas: ["홍대"], followers: "", note: "홍대 글로벌센터, 다국어 통역" },
  { name: "리엘르의원 홍대점", handle: "reele_clinic_hongdae", areas: ["홍대"], followers: "", note: "홍대, 한국인 타깃, LINE 고객센터" },
  { name: "뷰티블라썸의원", handle: "beautyblossom_clinic", areas: ["홍대"], followers: "", note: "합정·홍대" },
  { name: "포레나클리닉 홍대", handle: "forenaclinic", areas: ["홍대"], followers: "", note: "홍대, 외국인 후기 콘텐츠" },
  { name: "마인드피부과", handle: "mindskin_clinic", areas: ["홍대"], followers: "", note: "홍대" },
  { name: "아르스킨의원 홍대", handle: "arskin_hongdae", areas: ["홍대"], followers: "", note: "홍대입구역, 리프팅·피부관리" },
  { name: "나인의원 홍대점", handle: "nainskin_hongdae", areas: ["홍대"], followers: "", note: "홍대입구역 2번 출구" },
  { name: "리즈온클리닉 홍대점", handle: "lizonclinic_hongdae", areas: ["홍대"], followers: "", note: "홍대입구역, 중국인 타깃" },
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
  { name: "오테나의원 명동", handle: "otenaclinic.jp", areas: ["명동"], followers: "", note: "명동/남대문로, 일본어 계정·일·영·중·태 다국어" },
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
  // 김포 권역 (3개 지역 외 — areas 빈 배열, 워치리스트 수집 대상)
  { name: "유앤아이의원 김포점", handle: "youandi_gimpo_jp", areas: [], followers: "", note: "김포공항 인근, 일본어 계정", lineUrl: YOUANDI_LINE_URL },
];

// ---------- 한국인 타깃 클리닉 (소비자 /ko 페이지 전용) ----------
// 수집 워치리스트(KNOWN_CLINICS)와 분리 — 여기 추가해도 Apify 수집 대상·비용은 변하지 않는다.
// 출처: 해시태그 발굴로 수집된 한국어 게시물 상위 계정 (2026-07-03 스냅샷, 병원 신호 확인분)
export const KR_CONSUMER_CLINICS: KnownClinic[] = [
  { name: "리나인의원", handle: "renine_clinic", areas: ["명동"], followers: "", note: "한국인 타깃" },
  { name: "커브라인의원", handle: "curve.line_clinic", areas: ["명동"], followers: "", note: "한국인 타깃" },
  { name: "오블리주의원 홍대", handle: "ohvelyjoo_hongdae", areas: ["홍대"], followers: "", note: "한국인 타깃 (한국어 계정)" },
  { name: "닥터에버스의원 홍대점", handle: "dr.evers_hongdae_kr", areas: ["홍대"], followers: "", note: "한국인 타깃 (한국어 계정)" },
  { name: "도브의원", handle: "doveclinic", areas: ["강남"], followers: "", note: "한국인 타깃" },
  { name: "BLS클리닉 명동", handle: "md_blsclinic", areas: ["명동"], followers: "", note: "한국인 타깃 (한국어 계정), 리프팅 기기 다수" },
  { name: "디온의원 홍대점", handle: "theon_hongdae", areas: ["홍대"], followers: "", note: "한국인 타깃" },
  { name: "MJ올피부과 명동", handle: "mjall__dermatology", areas: ["명동"], followers: "", note: "한국인 타깃, 피부과 전문의" },
  { name: "명동아이디의원", handle: "idclinic_md_kor", areas: ["명동"], followers: "", note: "한국인 타깃 (한국어 계정)" },
  { name: "리앤스타의원 압구정", handle: "leenstar_apgujeong", areas: ["강남"], followers: "", note: "한국인 타깃" },
  { name: "에이포의원 압구정", handle: "aforclinic.ko", areas: ["강남"], followers: "", note: "한국인 타깃" },
  { name: "청담루비의원", handle: "rubyclinic_cheongdam", areas: ["강남"], followers: "", note: "한국인 타깃" },
  { name: "UH CELL의원 강남점", handle: "uhcell_gangnam", areas: ["강남"], followers: "", note: "한국인 타깃 (한국어 계정)" },
  { name: "타임리스피부과 마포본점", handle: "timeless_mapo", areas: ["홍대"], followers: "", note: "한국인 타깃, 마포/홍대 권역" },
  { name: "파인드피부과 압구정", handle: "pind.derma", areas: ["강남"], followers: "", note: "한국인 타깃, 피부과 전문의" },
  { name: "슬림영의원", handle: "slimyoung_clinic", areas: ["명동"], followers: "", note: "한국인 타깃" },
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
// 인플루언서(개인 크리에이터) 카테고리 — 시술 관련이면 제외 대신 "influencer" 로 분류
const INFLUENCER_CATEGORIES = [
  "blogger", "personal blog", "blog", "video creator", "digital creator", "influencer",
  "makeup artist", "public figure", "artist",
  "블로그", "크리에이터",
];

// 인플루언서 텍스트 신호 (협찬·체험단 표기, 뷰티로그 계열) — 부분 문자열 매칭
const INFLUENCER_SIGNALS = [
  "협찬", "유료광고", "광고포함", "체험단", "제공받", "내돈내산", "공구",
  "뷰티로그", "beautylog", "dailybeauty", "리뷰왕", "리뷰맨", "꿀팁", "비결",
  "sponsored",
];
// #ad·#pr 는 정확한 태그일 때만 — 부분 문자열로 하면 #PRogram, #ADvanced 등을 협찬으로 오인한다
const SPONSOR_TAG_RE = /#(ad|pr)(?![a-z0-9_])/i;

/** 협찬·체험단 신호 여부 (텍스트 신호 + 정확한 #ad/#pr 태그) — '계정 분류'용 휴리스틱.
 *  내돈내산·꿀팁 같은 후기 어투 신호가 섞여 있어 '협찬 표시' 판정에는 쓰면 안 된다. */
export function hasSponsorSignal(text?: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return INFLUENCER_SIGNALS.some((s) => t.includes(s.toLowerCase())) || SPONSOR_TAG_RE.test(t);
}

// 협찬 '자기표기' 문구만 — 분류 신호와 달리 명시적 공개 선언. '내돈내산'(자비 구매 선언)이
// 포함되면 비협찬 후기에 협찬 배지가 붙는 오탐이 난다.
const SPONSOR_DISCLOSURE = [
  "협찬", "유료광고", "유료 광고", "광고포함", "광고 포함", "체험단", "제공받",
  "提供を受け", "広告案件", "pr投稿", "sponsored",
];

/** 협찬 자기표기 감지 — 투명성 배지용 (명시적 공개 문구 + 정확한 #ad/#pr 태그만) */
export function hasSponsorDisclosure(text?: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return SPONSOR_DISCLOSURE.some((s) => t.includes(s)) || SPONSOR_TAG_RE.test(t);
}

const NON_CLINIC_CATEGORIES = [
  "marketing agency", "advertising", "media", "product/service", "shopping",
  "retail", "e-commerce", "cosmetics", "health/beauty store", "travel",
  "personal goods", "brand", "clothing",
  "beauty, cosmetic & personal care", "beauty supply store", "cosmetics store",
  "perfume",
  "쇼핑", "마케팅", "화장품", "여행",
];

function categoryMatch(cat: string | undefined, list: string[]): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return list.some((s) => c.includes(s));
}

/** Meta 페이지 카테고리가 의료(병원/피부과/성형외과 등)인지 — 의료기관 검증의 양성 신호 */
/** 텍스트(계정명·핸들·캡션 등)에 의료기관 신호(의원/클리닉/피부과/clinic/皮膚科 등)가 있는지 */
export function hasClinicSignal(text?: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return CLINIC_SIGNALS.some((sig) => t.includes(sig.toLowerCase()));
}

export function isMedicalCategory(pageCategory?: string): boolean {
  return categoryMatch(pageCategory, MEDICAL_CATEGORIES);
}

/** 광고를 피드에서 제외할지 (true = 제외). pageCategory(있으면) 우선. */
export type AdvertiserType = "clinic" | "influencer";

/**
 * 광고주 분류 — 병원(clinic) / 인플루언서(influencer) / 제외(null).
 * 기존엔 인플루언서를 잡광고와 함께 버렸지만, 시술 관련 인플루언서 광고는
 * "어떤 병원이 누구에게 협찬을 도는지" 볼 수 있는 별도 데이터라 라벨로 보존한다.
 *  - clinic: 허용 클리닉 / 의료 카테고리 / 클리닉 텍스트 신호 / 애매(기존 동작 유지)
 *  - influencer: 크리에이터·블로거 카테고리 또는 협찬 신호 + "시술 관련"일 때만
 *    (시술 키워드나 클리닉 언급이 없으면 그냥 잡광고 → 제외)
 *  - null(제외): 차단목록, 제품·화장품·대행사·여행 등
 */
export function classifyAdvertiser(
  igUsername?: string,
  name?: string,
  text?: string,
  pageCategory?: string
): AdvertiserType | null {
  const id = `${igUsername ?? ""} ${name ?? ""}`.toLowerCase();
  if (ALLOW_PARTS.some((p) => id.includes(p))) return "clinic"; // 허용 클리닉
  if (isBlockedAdvertiser(igUsername, name)) return null; // 차단목록 → 제외

  const t = `${name ?? ""} ${text ?? ""}`.toLowerCase();
  const treatmentRelated =
    classifyTreatment(t) !== null || CLINIC_SIGNALS.some((s) => t.includes(s.toLowerCase()));
  const influencerText = hasSponsorSignal(t);
  // 병원 여부는 '계정 정체성'(핸들+프로필명)으로만 판단한다.
  // 캡션의 병원 언급은 개인 후기에도 흔해서(예: "#손유나클리닉 다녀옴") clinic 근거로 쓰면
  // 시술후기가 전부 병원으로 분류돼 버린다 — 캡션은 treatmentRelated(시술 관련성)로만 활용.
  const clinicIdentity =
    CLINIC_SIGNALS.some((s) => id.includes(s.toLowerCase())) ||
    /닥터|\bdr\.|doctor/.test(id);

  // ① Meta 카테고리 (가장 정확)
  if (categoryMatch(pageCategory, MEDICAL_CATEGORIES)) return "clinic";
  if (categoryMatch(pageCategory, INFLUENCER_CATEGORIES)) {
    return treatmentRelated ? "influencer" : null;
  }
  if (categoryMatch(pageCategory, NON_CLINIC_CATEGORIES)) return null;

  // ② 정체성·텍스트 신호 (카테고리가 없거나 'Health/beauty'처럼 애매할 때)
  //    협찬 신호가 있으면 클리닉 정체성보다 우선 — 병원을 언급하는 협찬글이 clinic 으로 새지 않게
  if (influencerText) return treatmentRelated ? "influencer" : null;
  if (clinicIdentity) return "clinic";
  if (NON_CLINIC_SIGNALS.some((s) => t.includes(s.toLowerCase()))) return null;
  // 계정명엔 병원 신호가 없는데 글은 시술·병원 이야기 → 개인 시술후기
  if (treatmentRelated) return "influencer";
  return "clinic"; // 애매 → 유지 (기존 동작과 동일, 이후 의료 게이트가 한 번 더 거름)
}

/** 광고를 피드에서 제외할지 (true = 제외) — classifyAdvertiser 의 하위호환 래퍼 */
export function isExcludedAd(
  igUsername?: string,
  name?: string,
  text?: string,
  pageCategory?: string
): boolean {
  return classifyAdvertiser(igUsername, name, text, pageCategory) === null;
}

/**
 * 저장 스냅샷의 광고주 라벨 재계산 — 조회 시점에 적용.
 *
 * 라벨은 수집 시점에 찍히므로 분류기를 개선해도 과거 수집분(15일 보관)은 옛 라벨로
 * 남는다. 재수집(주 2회·과금)을 기다리는 대신, 저장된 필드만으로 결정되는 분류라
 * 읽을 때 재계산해 개선이 전체 데이터에 즉시 반영되게 한다. (CPU 코스트만, Apify 0원)
 *  - 등록·승인 병원(featured) → 항상 clinic
 *  - 오가닉 → 항상 재계산 (스냅샷 캡션은 200자 절단본이지만 신호 판별에는 충분)
 *  - 유료 광고 → 수집 시 Meta 카테고리 기반 라벨을 신뢰, 라벨 없던 레거시만 재계산
 */
export function reclassifyStored(list: Ad[]): Ad[] {
  return list.map((a) => {
    if (a.featured) {
      return a.advertiserType === "clinic" ? a : { ...a, advertiserType: "clinic" as const };
    }
    const isOrganic = (a.kind ?? "ad") === "organic";
    if (!isOrganic && a.advertiserType) return a;
    const text = `${a.caption ?? ""} ${(a.hashtags ?? []).join(" ")}`;
    const next =
      classifyAdvertiser(a.igUsername, a.clinic, text, a.pageCategory) ??
      a.advertiserType ??
      ("clinic" as const); // null(잡계정 판정)이어도 저장분은 유지 — 조회 시점엔 라벨만 바꾼다
    return next === a.advertiserType ? a : { ...a, advertiserType: next };
  });
}
