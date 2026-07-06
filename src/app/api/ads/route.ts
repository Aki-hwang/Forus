import { NextResponse } from "next/server";
import { sampleAds } from "@/lib/sampleAds";
import {
  readSnapshot,
  readBlocklist,
  applyBlocklist,
  annotateImageHealth,
  readAdvTypeOverrides,
  applyAdvTypeOverrides,
} from "@/lib/snapshot";
import { reclassifyStored } from "@/lib/clinics";
import { slimForList, LIST_CACHE_HEADERS } from "@/lib/apiCache";

// 저장된 스냅샷만 읽는다(무료) + 차단목록 + 라벨 재계산(레거시 라벨 보정). 수집은 /api/collect 에서만.
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await readSnapshot("ads");
  if (snap && snap.ads.length > 0) {
    const [block, overrides] = await Promise.all([readBlocklist(), readAdvTypeOverrides()]);
    const ads = (
      await annotateImageHealth(
        applyAdvTypeOverrides(reclassifyStored(applyBlocklist(snap.ads, block)), overrides)
      )
    ).map(slimForList);
    return NextResponse.json(
      { source: "apify", collectedAt: snap.collectedAt, count: ads.length, ads },
      { headers: LIST_CACHE_HEADERS }
    );
  }
  return NextResponse.json({ source: "sample", count: sampleAds.length, ads: sampleAds });
}
