// 수집 1회 예산 플래너 — "한 번 수집에 $N 까지만" 을 보장한다.
//
// 비용은 오직 /api/collect(수집 버튼)에서만 발생한다(서빙은 스냅샷만 읽어 무료). 두 액터 모두
// 결과 1건당 과금(pay-per-result)이라, 요청 건수 상한 = 비용 상한이다. 이 모듈은 "이상적 풀수집"
// 목표치의 예상비용을 계산해, 예산(APIFY_BUDGET_USD)을 넘으면 수집량을 자동 축소해 맞춘다.
//
// 액터 단가(2026 기준, env 로 덮어쓰기 가능):
//   curious_coder/facebook-ads-library-scraper  ≈ $0.75 / 1,000건  (광고)
//   apify/instagram-scraper                      ≈ $2.70 / 1,000건  (무료 게시물·조회수)
// 인스타가 광고보다 건당 3배 이상 비싸 IG(무료+조회수)부터 깎인다.
//
// 환경변수:
//   APIFY_BUDGET_USD      (선택) 수집 1회 비용 상한($), 기본 7. 이 금액 안에서 수집량 자동 산정.
//   APIFY_AD_COST_PER_1K  (선택) 광고 액터 1,000건당 단가($), 기본 0.75.
//   APIFY_IG_COST_PER_1K  (선택) 인스타 액터 1,000건당 단가($), 기본 2.70.
// 이상적 풀수집 목표치(예산이 넉넉하면 이 값까지 수집, 부족하면 비례 축소):
//   APIFY_TARGET_QUERIES(70) APIFY_TARGET_PER_QUERY(40)            — 광고
//   APIFY_TARGET_VIEW_PROFILES(20) APIFY_TARGET_VIEW_POSTS(5)      — 조회수 보강
//   APIFY_TARGET_ORG_PROFILES(80) APIFY_TARGET_ORG_POSTS(6)        — 무료: 워치리스트
//   APIFY_TARGET_ORG_TAGS(12) APIFY_TARGET_ORG_TAG_POSTS(20)       — 무료: 해시태그 발굴

function envNum(key: string, def: number, min = 0): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? Math.max(min, v) : def;
}
function envInt(key: string, def: number, min = 1): number {
  const v = Math.floor(Number(process.env[key]));
  return Number.isFinite(v) && v > 0 ? Math.max(min, v) : def;
}

export interface CollectionPlan {
  budgetUsd: number;
  /** fetchAdsViaApify 에 넘길 광고 수집 옵션 */
  ad: { maxQueries: number; perQuery: number };
  /** enrichAdsWithViews(조회수 보강) 에 넘길 옵션 */
  views: { profilesCap: number; posts: number };
  /** fetchOrganicViaApify 에 넘길 무료 게시물 옵션 */
  organic: { profileCap: number; postsPerProfile: number; hashtagCap: number; postsPerTag: number };
  /** 요청 건수 기준 예상비용($) — 실제는 보통 이보다 적다(상한 추정). */
  est: { ads: number; views: number; organic: number; total: number };
  price: { adPer1k: number; igPer1k: number };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 예산(기본 $5)에 맞춰 수집량을 산정한다.
 * - 예상비용 ≤ 예산이면 목표치 그대로(풀수집).
 * - 초과하면 먼저 깊이(perQuery·게시물수)를 줄이고, 그래도 넘으면 폭(쿼리·프로필·태그 수)을 줄인다.
 *   (깊이부터 줄여 검색 "다양성"=커버리지를 최대한 보존 — JP/권역 누락 방지)
 */
export function planCollection(): CollectionPlan {
  const budget = envNum("APIFY_BUDGET_USD", 7, 0.5);
  const adPer1k = envNum("APIFY_AD_COST_PER_1K", 0.75, 0);
  const igPer1k = envNum("APIFY_IG_COST_PER_1K", 2.7, 0);

  let adQ = envInt("APIFY_TARGET_QUERIES", 70, 1);
  let adPQ = envInt("APIFY_TARGET_PER_QUERY", 40, 10);
  let vP = envInt("APIFY_TARGET_VIEW_PROFILES", 20, 1);
  let vPosts = envInt("APIFY_TARGET_VIEW_POSTS", 5, 3);
  let oPC = envInt("APIFY_TARGET_ORG_PROFILES", 80, 1);
  let oPPP = envInt("APIFY_TARGET_ORG_POSTS", 6, 3);
  let oHC = envInt("APIFY_TARGET_ORG_TAGS", 12, 1);
  let oPPT = envInt("APIFY_TARGET_ORG_TAG_POSTS", 20, 3);

  const cost = () => {
    const ads = (adQ * adPQ * adPer1k) / 1000;
    const views = (vP * vPosts * igPer1k) / 1000;
    const organic = ((oPC * oPPP + oHC * oPPT) * igPer1k) / 1000;
    return { ads, views, organic, total: ads + views + organic };
  };

  let c = cost();
  if (c.total > budget && c.total > 0) {
    // 1차: 깊이 축소(폭=커버리지 보존). perQuery≥10, 게시물수≥3 은 액터 최소치.
    const f = budget / c.total;
    adPQ = Math.max(10, Math.round(adPQ * f));
    vPosts = Math.max(3, Math.round(vPosts * f));
    oPPP = Math.max(3, Math.round(oPPP * f));
    oPPT = Math.max(3, Math.round(oPPT * f));
    c = cost();
    // 2차: 최소치에 걸려 아직 초과하면 폭(쿼리·프로필·태그 수)까지 비례 축소.
    if (c.total > budget) {
      const f2 = budget / c.total;
      adQ = Math.max(1, Math.round(adQ * f2));
      vP = Math.max(1, Math.round(vP * f2));
      oPC = Math.max(1, Math.round(oPC * f2));
      oHC = Math.max(1, Math.round(oHC * f2));
      c = cost();
    }
  }

  return {
    budgetUsd: budget,
    ad: { maxQueries: adQ, perQuery: adPQ },
    views: { profilesCap: vP, posts: vPosts },
    organic: { profileCap: oPC, postsPerProfile: oPPP, hashtagCap: oHC, postsPerTag: oPPT },
    est: { ads: round(c.ads), views: round(c.views), organic: round(c.organic), total: round(c.total) },
    price: { adPer1k, igPer1k },
  };
}
