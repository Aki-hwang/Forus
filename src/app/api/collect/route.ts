import { NextResponse } from "next/server";
import { fetchAdsViaApify, enrichAdsWithViews } from "@/lib/apify";
import { fetchOrganicViaApify } from "@/lib/organic";
import { writeSnapshot } from "@/lib/snapshot";

// 실제 수집(=Apify 과금)이 일어나는 유일한 엔드포인트. COLLECT_KEY 로 보호.
// 호출 예: GET /api/collect?key=YOUR_SECRET  (주 1회 스케줄러나 수동으로만 호출)
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result: Record<string, unknown> = { startedAt: new Date().toISOString() };

  // 1) 광고 라이브러리 + 조회수 보강 → 스냅샷 저장
  try {
    const ads = await fetchAdsViaApify(true);
    if (ads && ads.length > 0) {
      const enriched =
        process.env.COLLECT_VIEWS === "0" ? ads : await enrichAdsWithViews(ads);
      await writeSnapshot("ads", enriched);
      result.ads = enriched.length;
    } else {
      result.ads = 0;
    }
  } catch (e) {
    result.adsError = String(e);
  }

  // 2) 오가닉(IG) → 스냅샷 저장
  try {
    const organic = await fetchOrganicViaApify(true);
    if (organic && organic.length > 0) {
      await writeSnapshot("organic", organic);
      result.organic = organic.length;
    } else {
      result.organic = 0;
    }
  } catch (e) {
    result.organicError = String(e);
  }

  result.finishedAt = new Date().toISOString();
  return NextResponse.json(result);
}
