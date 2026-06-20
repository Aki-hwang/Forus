import { NextResponse } from "next/server";
import { fetchAdsViaApify, enrichAdsWithViews } from "@/lib/apify";
import { fetchOrganicViaApify } from "@/lib/organic";
import { writeSnapshot } from "@/lib/snapshot";

// 실제 수집(=Apify 과금)이 일어나는 유일한 엔드포인트. COLLECT_KEY 로 보호.
// 시간제한(5분)을 넘기지 않도록 광고/오가닉을 따로 호출할 수 있게 part 지원.
//   광고만:   /api/collect?key=KEY&full=1&part=ads&views=0
//   오가닉만: /api/collect?key=KEY&full=1&part=organic
//   둘 다:    /api/collect?key=KEY            (절약 모드 소량일 때만 권장)
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const full = url.searchParams.get("full") === "1";
  const part = url.searchParams.get("part"); // "ads" | "organic" | null(둘 다)
  const doAds = part !== "organic";
  const doOrganic = part !== "ads";
  // 조회수 보강(추가 과금·시간). 기본 켜짐, ?views=0 또는 COLLECT_VIEWS=0 이면 끔.
  const enrich = url.searchParams.get("views") !== "0" && process.env.COLLECT_VIEWS !== "0";

  const result: Record<string, unknown> = { startedAt: new Date().toISOString(), full, part: part ?? "both", enrich };

  if (doAds) {
    try {
      const ads = await fetchAdsViaApify(true, full ? { maxQueries: 70, perQuery: 40 } : {});
      if (ads && ads.length > 0) {
        const finalAds = enrich ? await enrichAdsWithViews(ads) : ads;
        await writeSnapshot("ads", finalAds);
        result.ads = finalAds.length;
      } else {
        result.ads = 0;
      }
    } catch (e) {
      result.adsError = String(e);
    }
  }

  if (doOrganic) {
    try {
      const organic = await fetchOrganicViaApify(
        true,
        full ? { profileCap: 80, postsPerProfile: 6, hashtagCap: 12, postsPerTag: 20 } : {}
      );
      if (organic && organic.length > 0) {
        await writeSnapshot("organic", organic);
        result.organic = organic.length;
      } else {
        result.organic = 0;
      }
    } catch (e) {
      result.organicError = String(e);
    }
  }

  result.finishedAt = new Date().toISOString();
  return NextResponse.json(result);
}
