import { NextResponse } from "next/server";
import { fetchAdsViaApify, enrichAdsWithViews } from "@/lib/apify";
import { fetchOrganicViaApify } from "@/lib/organic";
import { writeSnapshot, mergeSnapshot, warmImageCache } from "@/lib/snapshot";

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

  // 볼륨 가드 — 이 인스턴스에 영구 볼륨이 안 붙어있으면 수집을 거부한다(=과금 0).
  // 저장 안 될 임시 인스턴스에서 헛돈 쓰는 것을 원천 차단. Railway Replicas=1 권장.
  const mountPath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (mountPath !== "/data" && process.env.COLLECT_ALLOW_NO_VOLUME !== "1") {
    return NextResponse.json(
      {
        error: "no_volume",
        message:
          "이 인스턴스에 /data 볼륨이 없어 수집 결과가 저장되지 않습니다. Railway에서 Replicas=1로 두고 재배포해 볼륨 인스턴스로 단일화한 뒤 다시 시도하세요. (무시하려면 COLLECT_ALLOW_NO_VOLUME=1)",
        railwayMountPath: mountPath ?? null,
      },
      { status: 409 }
    );
  }

  const full = url.searchParams.get("full") === "1";
  const part = url.searchParams.get("part"); // "ads" | "organic" | null(둘 다)
  const doAds = part !== "organic";
  const doOrganic = part !== "ads";
  // 조회수 보강(추가 과금·시간). 기본 켜짐, ?views=0 또는 COLLECT_VIEWS=0 이면 끔.
  const enrich = url.searchParams.get("views") !== "0" && process.env.COLLECT_VIEWS !== "0";
  // 기본: 90일 누적 병합. ?merge=0 이면 기존 데이터 무시하고 덮어쓰기.
  const doMerge = url.searchParams.get("merge") !== "0";

  const result: Record<string, unknown> = { startedAt: new Date().toISOString(), full, part: part ?? "both", enrich, merge: doMerge };

  if (doAds) {
    try {
      const ads = await fetchAdsViaApify(true, full ? { maxQueries: 70, perQuery: 40 } : {});
      if (ads && ads.length > 0) {
        const finalAds = enrich ? await enrichAdsWithViews(ads) : ads;
        if (doMerge) {
          const m = await mergeSnapshot("ads", finalAds);
          result.ads = m.total;
          result.adsAdded = m.added;
          result.adsUpdated = m.updated;
        } else {
          await writeSnapshot("ads", finalAds);
          result.ads = finalAds.length;
        }
        result.adsImgCached = await warmImageCache(finalAds);
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
        if (doMerge) {
          const m = await mergeSnapshot("organic", organic);
          result.organic = m.total;
          result.organicAdded = m.added;
          result.organicUpdated = m.updated;
        } else {
          await writeSnapshot("organic", organic);
          result.organic = organic.length;
        }
        result.organicImgCached = await warmImageCache(organic);
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
