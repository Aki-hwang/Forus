// 대시보드 라우트(서버 컴포넌트) — 스냅샷을 서버에서 직접 읽어 초기 데이터를 내려준다.
//
// 예전엔 클라이언트가 마운트 후 /api/ads·/api/organic 을 fetch 해 "빈 화면 + 스피너"가
// 길게 떴다(HTML → JS → 하이드레이션 → fetch → 렌더 4단계 워터폴). 이제 서버가 볼륨의
// 스냅샷(인메모리 파싱 캐시, ~0.07ms)을 읽어 카드가 박힌 HTML 을 바로 스트리밍한다.
//
// 단, 전체(~1,200장)를 다 심으면 HTML 이 2.4MB 까지 커져 오히려 로딩이 느려진다.
// 첫 화면용 상위 슬라이스만 심고(공용 trendingSort 로 클라이언트와 같은 순서 보장),
// 전체 목록은 마운트 후 /api 로 백그라운드 교체한다(initialPartial).
// 조회 무료 원칙 그대로 — Apify 호출 없음.

import { readSnapshot, readBlocklist, applyBlocklist } from "@/lib/snapshot";
import { reclassifyStored } from "@/lib/clinics";
import { slimForList } from "@/lib/apiCache";
import { mergeForGallery, trendingComparator } from "@/lib/trendingSort";
import { sampleAds } from "@/lib/sampleAds";
import { Ad } from "@/lib/ads";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

// 첫 화면 + 한 스크롤 정도를 덮는 카드 수 (갤러리 페이지 크기 60 + 여유)
const INITIAL_CARDS = 90;

export default async function Page() {
  const [adsSnap, organicSnap, block] = await Promise.all([
    readSnapshot("ads"),
    readSnapshot("organic"),
    readBlocklist(),
  ]);
  // 요청 시각 — 서버 컴포넌트는 요청당 1회 실행(force-dynamic)이라 렌더 불안정성 없음.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  const hasAds = Boolean(adsSnap && adsSnap.ads.length > 0);
  // 라벨 재계산(reclassifyStored)을 API 와 동일하게 적용 — 대시보드 초기 데이터도
  // 분류기 개선이 즉시 반영되게 (안 하면 API 응답과 시술후기 개수가 어긋난다)
  const fullAds: Ad[] = hasAds
    ? reclassifyStored(applyBlocklist(adsSnap!.ads, block)).map(slimForList)
    : sampleAds;
  const fullOrganic: Ad[] =
    organicSnap && organicSnap.ads.length > 0
      ? reclassifyStored(applyBlocklist(organicSnap.ads, block)).map(slimForList)
      : [];

  // 첫 화면용 상위 슬라이스 — 클라이언트와 같은 병합·비교자로 잘라 하이드레이션/교체 시 순서 유지
  const merged = mergeForGallery(fullAds, fullOrganic);
  const top = [...merged].sort(trendingComparator(merged, nowMs)).slice(0, INITIAL_CARDS);
  const topIds = new Set(top.map((a) => a.id));
  const partial = merged.length > INITIAL_CARDS;
  const initialAds = partial ? fullAds.filter((a) => topIds.has(a.id)) : fullAds;
  const initialOrganic = partial
    ? fullOrganic.filter((a) => topIds.has(a.id))
    : fullOrganic;

  return (
    <HomeClient
      initialAds={initialAds}
      initialSource={hasAds ? "apify" : "sample"}
      initialOrganic={initialOrganic}
      initialCollectedAt={hasAds ? adsSnap!.collectedAt : organicSnap?.collectedAt ?? null}
      initialPartial={partial}
      // 날짜 의존 정렬(최근7일·일별셔플)의 기준 시각 — 서버·클라이언트가 같은 값을 쓴다
      nowMs={nowMs}
    />
  );
}
