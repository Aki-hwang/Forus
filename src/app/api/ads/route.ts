import { NextResponse } from "next/server";
import { ads as mockAds } from "@/lib/ads";
import { fetchAdsViaApify } from "@/lib/apify";

// 매 요청마다 수집 시도 (모듈 내부 TTL 캐시로 주 1회 수준으로 호출 제어)
export const dynamic = "force-dynamic";
// 광고 라이브러리 액터 런이 길어질 수 있어 라우트 최대 실행시간을 늘림
export const maxDuration = 300;

export async function GET() {
  const live = await fetchAdsViaApify();

  if (live && live.length > 0) {
    return NextResponse.json({ source: "apify", count: live.length, ads: live });
  }

  return NextResponse.json({ source: "mock", count: mockAds.length, ads: mockAds });
}
