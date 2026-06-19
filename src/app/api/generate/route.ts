import { NextResponse } from "next/server";
import { Ad, getAd, Lang } from "@/lib/ads";
import { generateCreative } from "@/lib/generate";

export async function POST(req: Request) {
  let body: {
    referenceId?: string;
    // 실시간 수집(Apify) 광고는 목업 배열에 없으므로 레퍼런스 전체를 함께 받는다.
    reference?: Ad;
    clinicName?: string;
    area?: string;
    lang?: Lang;
    seed?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { referenceId, clinicName, area, lang = "JP", seed = 0 } = body;

  if (!referenceId) {
    return NextResponse.json({ error: "referenceId required" }, { status: 400 });
  }

  // 클라이언트가 보낸 레퍼런스 우선, 없으면 목업에서 조회
  const reference = body.reference ?? getAd(referenceId);
  if (!reference) {
    return NextResponse.json({ error: "reference not found" }, { status: 404 });
  }

  const creative = generateCreative(reference, {
    referenceId,
    clinicName: clinicName?.trim() || "우리 클리닉",
    area,
    lang,
    seed,
  });

  // 생성 비용/지연을 흉내내어 살짝 지연 (실제 이미지 API 연동 시 교체)
  await new Promise((r) => setTimeout(r, 400));

  return NextResponse.json({ creative });
}
