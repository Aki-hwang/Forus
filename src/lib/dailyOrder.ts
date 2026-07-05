// 일별 셔플 시드 — "하루 안에선 고정, 로컬 자정마다 배치 변경"의 결정적 근거.
//
// 기본 '인기' 정렬은 조회수순이라 상위가 거의 고정 → 단골 방문자에겐 매일 같아 보인다.
// 이 시드로 인기 순위에 "그날의 지터"를 섞어, 인기 카드는 위에 남되 첫 화면 배치가 매일 회전.
// 랜덤이 아니라 (id, 날짜) 해시라 같은 날 새로고침엔 순서가 안 흔들린다.

/** 로컬 자정 기준 일련번호 — 자정마다 +1 되어 그날의 시드가 된다. */
export function dayNumber(now: Date = new Date()): number {
  const localMs = now.getTime() - now.getTimezoneOffset() * 60_000;
  return Math.floor(localMs / 86_400_000);
}

/** (id, day) → 결정적 [0,1) 지터. FNV-1a + 믹싱. 같은 입력이면 항상 같은 값. */
export function dailyJitter(id: string, day: number): number {
  let h = (2166136261 ^ day) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// 인기 정렬 blend 가중치 — qualityWeight 가 클수록 조회수 우세(변화 적음),
// 작을수록 그날 지터 우세(변화 큼). 0.55 는 "인기 카드 유지 + 첫 화면 뚜렷한 회전"의 절충값.
export const DAILY_QUALITY_WEIGHT = 0.55;
