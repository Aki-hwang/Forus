import { NextResponse } from "next/server";
import { sampleAds } from "@/lib/sampleAds";
import { readSnapshot, readBlocklist, applyBlocklist } from "@/lib/snapshot";

// 저장된 스냅샷만 읽는다(무료) + 차단목록 적용. 실제 수집은 /api/collect 에서만.
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await readSnapshot("ads");
  if (snap && snap.ads.length > 0) {
    const ads = applyBlocklist(snap.ads, await readBlocklist());
    return NextResponse.json({
      source: "apify",
      collectedAt: snap.collectedAt,
      count: ads.length,
      ads,
    });
  }
  return NextResponse.json({ source: "sample", count: sampleAds.length, ads: sampleAds });
}
