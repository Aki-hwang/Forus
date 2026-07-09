// 주간 레이더 리포트 집계 — 스냅샷을 KST 월요일 기준 주 단위로 잘라 즉석 계산.
// 크론·별도 저장 없음: 요청 시점 계산이라 수집(월·금 06:00 KST)이 끝나면 저절로 갱신된다.
// 90일 보관 스냅샷 덕에 과거 주차 리포트도 소급 생성된다 (아카이브 = SEO 자산).

import { Ad, TreatmentKey, TREATMENTS } from "./ads";
import { confidentTreatment } from "./treatments";
import { ConsumerData, engagement } from "./consumer";

const KST_OFFSET_MS = 9 * 3_600_000;
const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;
/** 아카이브 최대 조회 범위 — 스냅샷 보관(90일)과 맞춘 12주 */
export const MAX_WEEKS = 12;

/** ms 시각이 속한 'KST 월요일 00:00' 의 UTC ms */
export function weekStartOf(ms: number): number {
  const kstDay = Math.floor((ms + KST_OFFSET_MS) / DAY_MS);
  // epoch day 0 = 목요일 → 월요일은 (day - 4) % 7 === 0
  const monday = kstDay - ((((kstDay - 4) % 7) + 7) % 7);
  return monday * DAY_MS - KST_OFFSET_MS;
}

/** 주차 ID = 그 주 월요일의 KST 날짜 (YYYY-MM-DD) — URL 세그먼트로 사용 */
export function weekId(startMs: number): string {
  return new Date(startMs + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 주차 ID 파싱 — 형식과 '실제 월요일' 여부까지 검증, 아니면 null */
export function parseWeekId(id: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) return null;
  const ms = Date.parse(`${id}T00:00:00+09:00`);
  if (Number.isNaN(ms)) return null;
  return weekStartOf(ms) === ms ? ms : null;
}

/** 사이트 공통 규약과 같은 date 파싱 ("YYYY-MM-DD[ HH:mm]") — 실패 시 0 */
function postTime(a: Ad): number {
  const t = new Date((a.date ?? "").replace(" ", "T")).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function inWeek(a: Ad, startMs: number): boolean {
  const t = postTime(a);
  return t >= startMs && t < startMs + WEEK_MS;
}

/** 데이터가 존재하는 주차 ID 목록 — 최신 먼저, 최대 MAX_WEEKS. 중간 빈 주는 건너뛴다 */
export function availableWeeks(data: ConsumerData, nowMs: number): string[] {
  const current = weekStartOf(nowMs);
  const weeks: string[] = [];
  for (let s = current; s > current - MAX_WEEKS * WEEK_MS; s -= WEEK_MS) {
    if (data.posts.some((p) => inWeek(p, s)) || data.ads.some((a) => inWeek(a, s))) {
      weeks.push(weekId(s));
    }
  }
  return weeks;
}

export interface WeeklyTreatmentRow {
  key: TreatmentKey;
  /** 이번 주 게시물 수 (확신 분류만 — 기본값 폴백의 쏠림 방지) */
  count: number;
  /** 지난주 게시물 수 */
  prev: number;
  delta: number;
}

export interface WeeklyReport {
  /** 주차 ID (KST 월요일 YYYY-MM-DD) */
  id: string;
  startMs: number;
  isCurrent: boolean;
  postCount: number;
  adCount: number;
  accountCount: number;
  /** 시술 동향 — 게시물 수 내림차순, 이번 주·지난주 모두 0인 시술은 제외 */
  treatments: WeeklyTreatmentRow[];
  /** 이번 주 집행 시작한 광고 — 반응 순 */
  newAds: Ad[];
  /** 주간 인기 게시물 — 계정당 1건 (대시보드 TOP 패널과 같은 원칙) */
  topPosts: Ad[];
  /** 장수 진행 이벤트 — 최신 주 전용. activeDays 는 '현재까지' 누적값이라 과거 주엔 부정확 */
  longRunners: Ad[];
}

/** 계정당 1건만 남기는 필터 (조회수 공유 스탬프 계정의 목록 독식 방지) */
function onePerAccount(list: Ad[]): Ad[] {
  const seen = new Set<string>();
  return list.filter((a) => {
    const k = (a.igUsername ?? a.clinic).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** 페이지 진입점 — 주차 검증·선택까지 처리. null = 404 대상.
 *  (컴포넌트 렌더에서 Date.now() 를 못 쓰는 react-hooks/purity 규칙 때문에 여기서 처리) */
export function resolveWeekly(
  data: ConsumerData,
  week?: string
): { report: WeeklyReport; weeks: string[] } | null {
  const nowMs = Date.now();
  const weeks = availableWeeks(data, nowMs);
  let startMs: number;
  if (week) {
    const parsed = parseWeekId(week);
    // 형식 오류·월요일 아님·데이터 없는 주 → 404 (아카이브 링크는 weeks 에서만 생성)
    if (parsed === null || !weeks.includes(week)) return null;
    startMs = parsed;
  } else if (weeks.length > 0) {
    // /weekly = 데이터가 있는 가장 최근 주 (월요일 아침 수집 전엔 지난주가 뜬다)
    startMs = parseWeekId(weeks[0])!;
  } else {
    startMs = weekStartOf(nowMs);
  }
  return { report: buildWeeklyReport(data, startMs, nowMs), weeks };
}

export function buildWeeklyReport(
  data: ConsumerData,
  startMs: number,
  nowMs: number
): WeeklyReport {
  const isCurrent = weekStartOf(nowMs) === startMs;
  const posts = data.posts.filter((p) => inWeek(p, startMs));
  const adsInWeek = data.ads.filter((a) => inWeek(a, startMs));
  const prevPosts = data.posts.filter((p) => inWeek(p, startMs - WEEK_MS));

  const cnt = new Map<TreatmentKey, number>();
  const prevCnt = new Map<TreatmentKey, number>();
  for (const p of posts) {
    const t = confidentTreatment(p);
    if (t) cnt.set(t, (cnt.get(t) ?? 0) + 1);
  }
  for (const p of prevPosts) {
    const t = confidentTreatment(p);
    if (t) prevCnt.set(t, (prevCnt.get(t) ?? 0) + 1);
  }
  const treatments: WeeklyTreatmentRow[] = TREATMENTS.map((key) => {
    const count = cnt.get(key) ?? 0;
    const prev = prevCnt.get(key) ?? 0;
    return { key, count, prev, delta: count - prev };
  })
    .filter((r) => r.count > 0 || r.prev > 0)
    .sort((a, b) => b.count - a.count || b.delta - a.delta);

  const topPosts = onePerAccount(
    [...posts].sort((a, b) => engagement(b) - engagement(a))
  ).slice(0, 8);

  const newAds = [...adsInWeek].sort((a, b) => engagement(b) - engagement(a)).slice(0, 6);

  // data.ads 는 loadConsumerData 에서 이미 activeDays 내림차순
  const longRunners = isCurrent ? onePerAccount(data.ads).slice(0, 4) : [];

  const accounts = new Set(
    [...posts, ...adsInWeek].map((a) => (a.igUsername ?? a.clinic).toLowerCase())
  );

  return {
    id: weekId(startMs),
    startMs,
    isCurrent,
    postCount: posts.length,
    adCount: adsInWeek.length,
    accountCount: accounts.size,
    treatments,
    newAds,
    topPosts,
    longRunners,
  };
}
