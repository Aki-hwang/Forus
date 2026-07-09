// 대시보드 '인기' 정렬 — 서버(page.tsx 초기 슬라이스)·클라이언트(HomeClient) 공용.
//
// 초기 SSR 페이로드를 상위 N장으로 줄이려면 서버가 클라이언트와 "완전히 같은" 순서로
// 잘라야 한다 (다르면 전체 데이터 도착 시 카드가 재배치되며 화면이 튄다). 그래서
// 병합·EN 재분류·인기 비교자를 여기로 추출해 양쪽이 공유한다.

import { Ad, Lang } from "./ads";
import { dayNumber, dailyJitter, DAILY_QUALITY_WEIGHT } from "./dailyOrder";

/** 계정 그룹핑 키 — 소문자 정규화 (계정 단위 집계·중복 제거의 단일 기준) */
export function accountKey(a: Ad): string {
  return (a.igUsername ?? a.clinic).toLowerCase();
}

/** 계정당 1건만 남기는 필터 — Meta 광고는 계정 중앙값 조회수를 공유 스탬프하므로,
 *  제한이 없으면 다광고 계정이 같은 숫자로 TOP 목록을 독식한다 (TrendPanel·주간 리포트 공용) */
export function onePerAccount(list: Ad[]): Ad[] {
  const seen = new Set<string>();
  return list.filter((a) => {
    const k = accountKey(a);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export interface AdLeaderRow {
  clinic: string;
  igUsername?: string;
  ads: number;
  days: number;
}

/**
 * 광고 집행 리더보드 — 병원별 광고 수·누적 집행일수 (모든 소재 합산 = 투자 총량 지표).
 * 원본 목록(allAds)에서 집계할 것: galleryFresh 를 거친 목록은 죽은 이미지 광고가
 * 빠져 있어 집행 이력이 과소집계된다 (이미지 생존과 집행 기간은 무관).
 * 그룹 키는 광고주 페이지명(clinic) — 같은 광고주의 소재 일부에만 igUsername 이 있어
 * 핸들 키를 쓰면 한 병원이 두 줄로 쪼개진다.
 */
export function buildAdLeaderboard(ads: Ad[], top = 5): AdLeaderRow[] {
  const m = new Map<string, AdLeaderRow>();
  for (const a of ads) {
    if ((a.kind ?? "ad") === "organic" || a.advertiserType === "influencer") continue;
    const k = a.clinic.toLowerCase();
    const e = m.get(k) ?? { clinic: a.clinic, igUsername: a.igUsername, ads: 0, days: 0 };
    if (!e.igUsername && a.igUsername) e.igUsername = a.igUsername;
    e.ads += 1;
    e.days += a.activeDays ?? 0;
    m.set(k, e);
  }
  return [...m.values()].sort((x, y) => y.days - x.days || y.ads - x.ads).slice(0, top);
}

/** 광고 + 오가닉 병합 (id 중복 제거) + 레거시 EN 재분류 */
export function mergeForGallery(ads: Ad[], organic: Ad[]): Ad[] {
  const seen = new Set(ads.map((a) => a.id));
  const all = [...ads, ...organic.filter((a) => !seen.has(a.id))];
  // 기존 데이터엔 EN 분류가 없으므로, 한자·한글·가나 없고 라틴문자 우세하면 영어로 재분류
  const isEN = (a: Ad) => {
    const t = `${a.headline ?? ""} ${a.caption ?? ""}`;
    if (/[぀-ヿ가-힣㐀-鿿]/.test(t)) return false;
    return (t.match(/[A-Za-z]/g) || []).length >= 4;
  };
  return all.map((a) => (isEN(a) ? { ...a, lang: "EN" as Lang } : a));
}

/**
 * 갤러리 노출 필터 — 스냅샷 보관(90일)은 그대로 두고 노출만 거른다
 * (DM 추출·분석용 데이터 자산은 보존).
 *  - 죽은 이미지(imgCached:false — URL은 있지만 캐시에 실물 없음)는 아예 숨긴다.
 *    깨진 카드가 뒤에서라도 보이는 것보다 안 보이는 게 낫고, 다음 수집의 이미지
 *    워밍이 성공하면 플래그가 풀려 자동으로 다시 나타난다(주 2회).
 *  - 오가닉 게시물은 15일 이내만 (수집 최신성 정책 #39와 정렬).
 *    유료 광고는 시작일이 오래여도 '집행 중'일 수 있으므로 날짜로 자르지 않는다.
 */
export function galleryFresh(list: Ad[], nowMs: number): Ad[] {
  const cutoff = nowMs - 15 * 86_400_000;
  return list.filter((a) => {
    if (a.imgCached === false) return false;
    if ((a.kind ?? "ad") !== "organic") return true;
    const t = new Date((a.date ?? "").replace(" ", "T")).getTime();
    return Number.isNaN(t) || t >= cutoff;
  });
}

/** 인기(trending) 비교자 — 이미지 우선 → 최근 7일 → 일별 셔플(조회수 blend). */
export function trendingComparator(list: Ad[], nowMs: number): (a: Ad, b: Ad) => number {
  const reach = (a: Ad) => a.views ?? a.likes ?? 0;
  // '보이는 이미지'만 인정 — imageUrl 이 있어도 캐시에 실물이 없으면(imgCached:false,
  // 서명 만료로 렌더가 깨지는 케이스) 이미지 없는 카드로 취급해 뒤로 보낸다.
  const hasImg = (a: Ad) => Boolean(a.imageUrl) && a.imgCached !== false;
  const todayStart = new Date(nowMs);
  todayStart.setHours(0, 0, 0, 0);
  const cutoff = todayStart.getTime() - 7 * 86_400_000;
  const isRecent = (a: Ad) => {
    const ts = new Date((a.date ?? "").replace(" ", "T")).getTime();
    return !Number.isNaN(ts) && ts >= cutoff;
  };
  const day = dayNumber(new Date(nowMs));
  const qRank = new Map<string, number>();
  [...list].sort((a, b) => reach(b) - reach(a)).forEach((a, i) => qRank.set(a.id, i));
  const n = list.length || 1;
  const dailyScore = (a: Ad) =>
    (qRank.get(a.id) ?? 0) * DAILY_QUALITY_WEIGHT +
    dailyJitter(a.id, day) * n * (1 - DAILY_QUALITY_WEIGHT); // 낮을수록 앞

  return (a, b) => {
    // 이미지 유무가 최우선 — 신규(최근 7일)라도 썸네일 없는 카드가 첫 화면을 차지하지 않게
    const ia = hasImg(a);
    const ib = hasImg(b);
    if (ia !== ib) return ia ? -1 : 1;
    const ra = isRecent(a);
    const rb = isRecent(b);
    if (ra !== rb) return ra ? -1 : 1;
    return dailyScore(a) - dailyScore(b);
  };
}
