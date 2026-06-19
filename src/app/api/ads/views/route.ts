import { NextResponse } from "next/server";
import { sampleAds } from "@/lib/sampleAds";
import { fetchAdsViaApify, enrichAdsWithViews } from "@/lib/apify";

// 2단계: 1단계 광고에 인스타 조회수를 병합해 반환 (느리므로 클라이언트에서 비동기 호출)
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const live = await fetchAdsViaApify();

  if (live && live.length > 0) {
    const enriched = await enrichAdsWithViews(live);
    return NextResponse.json({ source: "apify", count: enriched.length, ads: enriched });
  }

  // 폴백: 수집 스냅샷(일부 조회수 포함)
  return NextResponse.json({ source: "sample", count: sampleAds.length, ads: sampleAds });
}
