import { NextResponse } from "next/server";
import { fetchOrganicViaApify } from "@/lib/organic";

// 오가닉(IG 자연 게시물) 수집. 모듈 내부 TTL 캐시로 호출 빈도 제어.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const organic = await fetchOrganicViaApify();
  if (organic && organic.length > 0) {
    return NextResponse.json({ source: "apify", count: organic.length, ads: organic });
  }
  // 미연결/한도/캐시없음 → 빈 배열(프론트는 광고만 표시)
  return NextResponse.json({ source: "none", count: 0, ads: [] });
}
