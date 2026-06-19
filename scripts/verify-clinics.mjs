// 광고주 이름 → 카카오 + 네이버 지도 로컬 검색 → "진료과목 피부과(병원/의원)" 판별
// (둘 중 한 곳이라도 피부과로 확인되면 인정 — 카카오 미등록 의원 보완)
//
// 실행 (egress로 dapi.kakao.com / openapi.naver.com 가능한 곳 + 키 필요):
//   KAKAO_REST_KEY=xxx \
//   NAVER_CLIENT_ID=yyy NAVER_CLIENT_SECRET=zzz \
//   node scripts/verify-clinics.mjs
// (둘 중 가진 키만 넣어도 동작 — 한 소스만 조회)
//
// 출력: 광고주별 판별 결과 + allowlist 후보(피부과로 확인된 이름) JSON.
// 지도는 한국 장소 기준이라 영문 IG 핸들(예: Idclinicjp)은 미발견될 수 있음(정상).

const KAKAO_KEY = process.env.KAKAO_REST_KEY;
const NAVER_ID = process.env.NAVER_CLIENT_ID;
const NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;
if (!KAKAO_KEY && !(NAVER_ID && NAVER_SECRET)) {
  console.error("KAKAO_REST_KEY 또는 NAVER_CLIENT_ID+NAVER_CLIENT_SECRET 중 하나는 필요합니다.");
  process.exit(1);
}
console.error(`소스: ${[KAKAO_KEY && "카카오", NAVER_ID && NAVER_SECRET && "네이버"].filter(Boolean).join(" + ")}`);

// 수집된 광고주 이름(중복 제거). 갱신 시 이 배열만 교체하면 됨.
const ADVERTISERS = [
  "dr_skinnote","Mayclinic メイクリニック","derma_trip","江南・新沙駅 プラチナムクリニックjp",
  "꿀팁알려주는여자","꿀피부 저장소","Idclinicjp","Every beautyday","Foreverclinicjp","뷰티연구",
  "멜로우피부과 청담","강남 피부과 할인 정보","Óḙeasᶏî","손주름 고민 끝","병원을 알아보다",
  "olicell_official","강남 뷰티 정보 공유","꿀피부 비결","언니의 뷰티공간","ユーピッククリニック",
  "Anua","Terapia","alantor","Pith 피쓰","피부관리 연구소","포레스트미디어랩","피부진리템",
  "gloryclinic_md","Idclinic md jp","유앤아이의원","꿀 피부 연구소","뷰티라운지의원","NoPain",
  "Toxnfill Myeongdong JP","Slimyoung JP","Cellin md jp","オブリージュ医院","Wooa plastic surgery korea",
  "BeautyblossomJapan","언니들의 뷰티꿀팁","병원에 대한 모든 것","DailyBeautylog","Beauty for U",
  "톤즈의원","브이의원 강남","청담피부119","Happyoct","속고민상담실","Station by UHC","메먼트",
  "블리비의원","Good To Great","P.CALM_Official","서울피부꿀팁정보","피부클린","theclimclinic_jp",
  "리더스피부과","DIetBeauty","메라블","톡스앤필","오드의원 ODE Clinic KR","씨스터앤",
  "예뻐지는 꿀팁 공유","뷰티/힐링 포인트","韓国ディオレクリニック","네오메딕스 뷰티",
  "bymuhly_hongdae_browdoll","briller_clinic","리뷰왕리뷰맨","티원콜라겐 Premium black","beau_ty_only",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripTag = (s) => (s || "").replace(/<[^>]+>/g, "");

// 카카오: [{name, category}]
async function searchKakao(query, retry = 0) {
  if (!KAKAO_KEY) return [];
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  if (res.status === 429 && retry < 3) { await sleep(1000 * (retry + 1)); return searchKakao(query, retry + 1); }
  if (!res.ok) return [];
  const j = await res.json();
  return (j.documents || []).map((d) => ({ name: d.place_name, category: d.category_name || "" }));
}

// 네이버: [{name, category}]
async function searchNaver(query, retry = 0) {
  if (!(NAVER_ID && NAVER_SECRET)) return [];
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;
  const res = await fetch(url, { headers: { "X-Naver-Client-Id": NAVER_ID, "X-Naver-Client-Secret": NAVER_SECRET } });
  if (res.status === 429 && retry < 3) { await sleep(1000 * (retry + 1)); return searchNaver(query, retry + 1); }
  if (!res.ok) return [];
  const j = await res.json();
  return (j.items || []).map((it) => ({ name: stripTag(it.title), category: it.category || "" }));
}

const isDerma = (c) => /피부과/.test(c) && /(병원|의원)/.test(c);
const isMed = (c) => /(병원|의원|성형외과|의료|클리닉)/.test(c);

function classify(places) {
  if (!places.length) return { verdict: "미발견" };
  const derma = places.find((p) => isDerma(p.category));
  if (derma) return { verdict: "피부과", place: derma };
  const med = places.find((p) => isMed(p.category));
  if (med) return { verdict: "병원/의원(비피부과)", place: med };
  return { verdict: "비클리닉", place: places[0] };
}

const verified = [];
const rows = [];
for (const name of ADVERTISERS) {
  const q = name.replace(/\s*\(.*\)$/, "").trim();
  const [k, n] = await Promise.all([searchKakao(q), searchNaver(q)]);
  const r = classify([...k, ...n]); // 두 소스 합쳐서 판별 (한 곳이라도 피부과면 인정)
  rows.push([name, r.verdict, r.place ? `${r.place.name} · ${r.place.category}` : ""]);
  if (r.verdict === "피부과") verified.push(name);
  await sleep(120); // rate limit 예의
}

console.log("\n=== 판별 결과 ===");
for (const [name, verdict, info] of rows) {
  console.log(`[${verdict}] ${name}${info ? "  → " + info : ""}`);
}
console.log(`\n총 ${ADVERTISERS.length}곳 중 피부과(병원/의원) 확인: ${verified.length}곳`);
console.log("\n=== allowlist 후보 (clinics.ts 에 반영) ===");
console.log(JSON.stringify(verified, null, 2));
