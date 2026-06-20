import { NextResponse } from "next/server";
import { sampleAds } from "@/lib/sampleAds";
import { readSnapshot } from "@/lib/snapshot";

// 저장된 스냅샷만 읽는다(무료). 실제 수집은 /api/collect 에서만 실행.
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await readSnapshot("ads");
  if (snap && snap.ads.length > 0) {
    return NextResponse.json({
      source: "apify",
      collectedAt: snap.collectedAt,
      count: snap.ads.length,
      ads: snap.ads,
    });
  }
  // 아직 수집 전 → 커밋된 샘플 스냅샷
  return NextResponse.json({ source: "sample", count: sampleAds.length, ads: sampleAds });
}
