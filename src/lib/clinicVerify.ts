// 광고주 이름 → 카카오/네이버 지역검색 API로 "병원·의원(피부과·성형외과 등)" 여부 검증.
// 화장품/제품/인플루언서/대행사 등 비의료 광고주를 걸러내는 양성(positive) 게이트.
// (둘 중 가진 키만 넣어도 동작 — 한 소스라도 의료기관으로 확인되면 인정)
//
// 환경변수 (둘 다 없으면 검증 비활성 → 호출부에서 기존 휴리스틱 필터로 폴백):
//   KAKAO_REST_KEY                         카카오 로컬 REST 키
//   NAVER_CLIENT_ID / NAVER_CLIENT_SECRET  네이버 지역검색(local) 키
//   CLINIC_VERIFY_TTL_SECONDS              검증 결과 캐시 TTL(초), 기본 2592000(30일)

export interface MedicalVerdict {
  /** 병원·의원·피부과·성형외과 등 의료기관으로 확인됨 */
  medical: boolean;
  /** 피부과로 확인됨 */
  derma: boolean;
  matchedName?: string;
  category?: string;
}

interface Place {
  name: string;
  category: string;
}

interface KakaoDoc {
  place_name?: string;
  category_name?: string;
}
interface NaverItem {
  title?: string;
  category?: string;
}

const stripTag = (s: string) => s.replace(/<[^>]+>/g, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 카카오/네이버 키가 하나라도 설정돼 있으면 검증 활성 */
export function hasClinicVerifyKeys(): boolean {
  return Boolean(
    process.env.KAKAO_REST_KEY?.trim() ||
      (process.env.NAVER_CLIENT_ID?.trim() && process.env.NAVER_CLIENT_SECRET?.trim())
  );
}

async function getJson(
  url: string,
  headers: Record<string, string>,
  retry = 0
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: ctrl.signal });
    if (res.status === 429 && retry < 3) {
      await sleep(800 * (retry + 1));
      return getJson(url, headers, retry + 1);
    }
    if (!res.ok) return { ok: false, status: res.status, body: null };
    return { ok: true, status: res.status, body: await res.json() };
  } catch {
    return { ok: false, status: 0, body: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function searchKakao(query: string): Promise<Place[]> {
  const key = process.env.KAKAO_REST_KEY?.trim();
  if (!key) return [];
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`;
  const { ok, body } = await getJson(url, { Authorization: `KakaoAK ${key}` });
  if (!ok) return [];
  const docs = (body as { documents?: KakaoDoc[] })?.documents ?? [];
  return docs.map((d) => ({ name: d.place_name ?? "", category: d.category_name ?? "" }));
}

async function searchNaver(query: string): Promise<Place[]> {
  const id = process.env.NAVER_CLIENT_ID?.trim();
  const secret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!id || !secret) return [];
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;
  const { ok, body } = await getJson(url, {
    "X-Naver-Client-Id": id,
    "X-Naver-Client-Secret": secret,
  });
  if (!ok) return [];
  const items = (body as { items?: NaverItem[] })?.items ?? [];
  return items.map((it) => ({ name: stripTag(it.title ?? ""), category: it.category ?? "" }));
}

const isDerma = (c: string) => /피부과/.test(c) && /(병원|의원)/.test(c);
const isMed = (c: string) => /(피부과|성형외과|병원|의원|의료|클리닉)/.test(c);

function classify(places: Place[]): MedicalVerdict {
  const derma = places.find((p) => isDerma(p.category));
  if (derma) return { medical: true, derma: true, matchedName: derma.name, category: derma.category };
  const med = places.find((p) => isMed(p.category));
  if (med) return { medical: true, derma: false, matchedName: med.name, category: med.category };
  return { medical: false, derma: false, matchedName: places[0]?.name, category: places[0]?.category };
}

/** 지도 검색용 질의어: 괄호 제거 후, 한글 토큰이 있으면 그 부분만(영문/일문 꼬리표 제거) */
function queryForName(name: string): string {
  const cleaned = name.replace(/\s*\(.*\)$/, "").trim();
  const hangul = cleaned.split(/\s+/).filter((t) => /[가-힣]/.test(t));
  return hangul.length ? hangul.join(" ") : cleaned;
}

const cache = new Map<string, { at: number; v: MedicalVerdict }>();
const ttlMs = () => (Number(process.env.CLINIC_VERIFY_TTL_SECONDS) || 2_592_000) * 1000;

async function verifyOne(query: string): Promise<MedicalVerdict> {
  const hit = cache.get(query);
  if (hit && Date.now() - hit.at < ttlMs()) return hit.v;
  const [k, n] = await Promise.all([searchKakao(query), searchNaver(query)]);
  const v = classify([...k, ...n]); // 두 소스 합쳐 판별 (한 곳이라도 의료기관이면 인정)
  cache.set(query, { at: Date.now(), v });
  return v;
}

/**
 * 광고주 이름들 → 이름별 의료기관 검증 결과(원본 이름 키).
 * 키가 없으면 빈 Map. 쿼리 단위 중복 제거 + 소규모 동시성 + rate-limit 간격.
 */
export async function verifyAdvertisers(names: string[]): Promise<Map<string, MedicalVerdict>> {
  const out = new Map<string, MedicalVerdict>();
  if (!hasClinicVerifyKeys()) return out;

  // 같은 클리닉(여러 광고)은 한 번만 조회
  const byQuery = new Map<string, string[]>();
  for (const name of names) {
    const q = queryForName(name);
    if (!q) continue;
    const arr = byQuery.get(q);
    if (arr) arr.push(name);
    else byQuery.set(q, [name]);
  }

  const queries = [...byQuery.keys()];
  const CONCURRENCY = 6;
  for (let i = 0; i < queries.length; i += CONCURRENCY) {
    const batch = queries.slice(i, i + CONCURRENCY);
    const verdicts = await Promise.all(batch.map((q) => verifyOne(q)));
    batch.forEach((q, idx) => {
      for (const name of byQuery.get(q) ?? []) out.set(name, verdicts[idx]);
    });
    if (i + CONCURRENCY < queries.length) await sleep(120);
  }
  return out;
}
