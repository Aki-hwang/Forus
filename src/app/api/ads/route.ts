import { NextResponse } from "next/server";
import { ads as mockAds } from "@/lib/ads";
import { fetchAdsViaApify } from "@/lib/apify";

// 매 요청마다 수집 시도 (모듈 내부 TTL 캐시로 Apify 호출 빈도 제어)
export const dynamic = "force-dynamic";

export async function GET() {
  const live = await fetchAdsViaApify();

  if (live && live.length > 0) {
    return NextResponse.json({ source: "apify", count: live.length, ads: live });
  }

  return NextResponse.json({ source: "mock", count: mockAds.length, ads: mockAds });
}
