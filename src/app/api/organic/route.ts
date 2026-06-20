import { NextResponse } from "next/server";
import { readSnapshot } from "@/lib/snapshot";

// 저장된 오가닉 스냅샷만 읽는다(무료). 수집은 /api/collect 에서만.
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await readSnapshot("organic");
  if (snap && snap.ads.length > 0) {
    return NextResponse.json({
      source: "apify",
      collectedAt: snap.collectedAt,
      count: snap.ads.length,
      ads: snap.ads,
    });
  }
  return NextResponse.json({ source: "none", count: 0, ads: [] });
}
