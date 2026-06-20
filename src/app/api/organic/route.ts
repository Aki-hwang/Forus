import { NextResponse } from "next/server";
import { readSnapshot, readBlocklist, applyBlocklist } from "@/lib/snapshot";

// 저장된 오가닉 스냅샷만 읽는다(무료) + 차단목록 적용.
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await readSnapshot("organic");
  if (snap && snap.ads.length > 0) {
    const ads = applyBlocklist(snap.ads, await readBlocklist());
    return NextResponse.json({
      source: "apify",
      collectedAt: snap.collectedAt,
      count: ads.length,
      ads,
    });
  }
  return NextResponse.json({ source: "none", count: 0, ads: [] });
}
