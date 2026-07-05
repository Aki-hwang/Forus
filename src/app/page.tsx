// 대시보드 라우트(서버 컴포넌트) — 스냅샷을 서버에서 직접 읽어 초기 데이터를 내려준다.
//
// 예전엔 클라이언트가 마운트 후 /api/ads·/api/organic 을 fetch 해 "빈 화면 + 스피너"가
// 길게 떴다(HTML → JS → 하이드레이션 → fetch → 렌더 4단계 워터폴). 이제 서버가 볼륨의
// 스냅샷(인메모리 파싱 캐시, ~0.07ms)을 읽어 카드가 박힌 HTML 을 바로 스트리밍한다.
// 조회 무료 원칙 그대로 — Apify 호출 없음.

import { readSnapshot, readBlocklist, applyBlocklist } from "@/lib/snapshot";
import { slimForList } from "@/lib/apiCache";
import { sampleAds } from "@/lib/sampleAds";
import { Ad } from "@/lib/ads";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

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
  const initialAds: Ad[] = hasAds
    ? applyBlocklist(adsSnap!.ads, block).map(slimForList)
    : sampleAds;
  const initialOrganic: Ad[] =
    organicSnap && organicSnap.ads.length > 0
      ? applyBlocklist(organicSnap.ads, block).map(slimForList)
      : [];

  return (
    <HomeClient
      initialAds={initialAds}
      initialSource={hasAds ? "apify" : "sample"}
      initialOrganic={initialOrganic}
      initialCollectedAt={hasAds ? adsSnap!.collectedAt : organicSnap?.collectedAt ?? null}
      // 날짜 의존 정렬(최근7일·일별셔플)의 기준 시각 — 서버·클라이언트가 같은 값을 쓴다
      nowMs={nowMs}
    />
  );
}
