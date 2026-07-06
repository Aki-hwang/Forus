import { NextResponse } from "next/server";
import { readSnapshot, readBlocklist, applyBlocklist } from "@/lib/snapshot";
import { reclassifyStored } from "@/lib/clinics";
import { slimForList, LIST_CACHE_HEADERS } from "@/lib/apiCache";

// 저장된 오가닉 스냅샷만 읽는다(무료) + 차단목록 + 라벨 재계산(분류기 개선 즉시 반영).
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await readSnapshot("organic");
  if (snap && snap.ads.length > 0) {
    const ads = reclassifyStored(applyBlocklist(snap.ads, await readBlocklist())).map(slimForList);
    return NextResponse.json(
      { source: "apify", collectedAt: snap.collectedAt, count: ads.length, ads },
      { headers: LIST_CACHE_HEADERS }
    );
  }
  return NextResponse.json({ source: "none", count: 0, ads: [] });
}
