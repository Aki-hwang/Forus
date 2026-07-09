// 주간 레이더 리포트 집계 — 스냅샷을 주 단위로 잘라 즉석 계산.
// 크론·별도 저장 없음: 요청 시점 계산이라 수집(월·금 06:00 KST)이 끝나면 저절로 갱신된다.
// 90일 보관 스냅샷 덕에 과거 주차 리포트도 소급 생성된다 (아카이브 = SEO 자산).
//
// 주 경계는 'UTC 월요일 00:00'. 저장된 date 가 IG timestamp(UTC).slice(0,10) 즉
// UTC 달력 날짜라서, KST 경계를 쓰면 KST 월요일 00~09시 게시물이 전주로 밀리는
// 오분류가 생긴다 — 데이터의 시간대(UTC)에 경계를 맞추는 것이 유일하게 정합적이다.
// 체감상 '월요일 오전 9시(KST)에 주가 바뀌는' 셈이며 주차 ID(월요일 날짜)는 동일하다.

import { Ad, TreatmentKey } from "./ads";
import { onePerAccount } from "./trendingSort";
import { ConsumerData, engagement, treatmentCounts } from "./consumer";

const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;
/** 아카이브 최대 조회 범위 — 스냅샷 보관(90일)과 맞춘 12주 */
export const MAX_WEEKS = 12;

/** ms 시각이 속한 'UTC 월요일 00:00' */
export function weekStartOf(ms: number): number {
  const day = Math.floor(ms / DAY_MS);
  // epoch day 0 = 목요일 → 월요일은 (day - 4) % 7 === 0
  const monday = day - ((((day - 4) % 7) + 7) % 7);
  return monday * DAY_MS;
}

/** 주차 ID = 그 주 월요일 날짜 (YYYY-MM-DD, UTC) — URL 세그먼트로 사용 */
export function weekId(startMs: number): string {
  return new Date(startMs).toISOString().slice(0, 10);
}

/** 주차 ID 파싱 — 형식과 '실제 월요일' 여부까지 검증, 아니면 null */
export function parseWeekId(id: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) return null;
  const ms = Date.parse(`${id}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return weekStartOf(ms) === ms ? ms : null;
}

/** date 파싱 — 앞 10자(UTC 달력 날짜)만 사용해 서버 시간대와 무관하게 결정적. 실패 시 NaN */
function postTime(a: Ad): number {
  return Date.parse((a.date ?? "").slice(0, 10));
}

/** 데이터가 존재하는 주차 ID 목록 — 최신 먼저, 최대 MAX_WEEKS. 중간 빈 주는 건너뛴다 */
export function availableWeeks(data: ConsumerData, nowMs: number): string[] {
  const current = weekStartOf(nowMs);
  const floor = current - MAX_WEEKS * WEEK_MS;
  // 한 번의 패스로 주차 버킷 구성 (주마다 전체 배열 재순회 방지)
  const buckets = new Set<number>();
  for (const a of [...data.posts, ...data.ads]) {
    const t = postTime(a);
    if (!Number.isNaN(t)) {
      const s = weekStartOf(t);
      if (s <= current && s > floor) buckets.add(s);
    }
  }
  return [...buckets].sort((a, b) => b - a).map(weekId);
}

export interface WeeklyTreatmentRow {
  key: TreatmentKey;
  /** 이번 주 게시물 수 (확신 분류만 — 기본값 폴백의 쏠림 방지) */
  count: number;
  /** 지난주 게시물 수 (진행 중인 주는 데이터가 있는 날수만큼만 잘라 비교) */
  prev: number;
  delta: number;
}

export interface WeeklyReport {
  /** 주차 ID (월요일 YYYY-MM-DD) */
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

function inWeek(a: Ad, startMs: number): boolean {
  const t = postTime(a);
  return t >= startMs && t < startMs + WEEK_MS;
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

  // '이번 주 시작한 광고' — 시작일 미상 광고는 수집 때마다 date 가 수집일로 재생성돼
  // 매주 신규로 둔갑한다. firstSeen(최초 수집 시각)이 주 시작 이전이면 이미 알던 광고
  // 이므로 제외 — 진짜 신규(이번 주 시작 or 이번 주 첫 발견)만 남는다.
  const adsInWeek = data.ads.filter((a) => {
    if (!inWeek(a, startMs)) return false;
    const fs = a.firstSeen ? Date.parse(a.firstSeen) : NaN;
    return Number.isNaN(fs) || fs >= startMs;
  });

  // 지난주 비교 창 — date 는 일 단위 해상도라 ms 단위로 자르면 매일 09:00(KST)부터
  // 지난주 같은 요일 전체가 유입돼 ▼로 기운다. 진행 중인 주는 '데이터가 존재하는
  // 마지막 날짜'까지의 일수만큼만 지난주를 잘라 같은 날수끼리 비교한다.
  const prevStart = startMs - WEEK_MS;
  let prevEnd = startMs;
  if (isCurrent) {
    const latest = posts.reduce((m, p) => Math.max(m, postTime(p)), 0);
    const days = latest >= startMs ? Math.floor((latest - startMs) / DAY_MS) + 1 : 0;
    prevEnd = prevStart + days * DAY_MS;
  }
  const prevPosts = data.posts.filter((p) => {
    const t = postTime(p);
    return t >= prevStart && t < prevEnd;
  });

  const cnt = treatmentCounts(posts);
  const prevCnt = treatmentCounts(prevPosts);
  const treatments: WeeklyTreatmentRow[] = [...cnt.keys()]
    .map((key) => {
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
