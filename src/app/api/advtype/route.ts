import { NextResponse } from "next/server";
import { readAdvTypeOverrides, setAdvTypeOverride, AdvType } from "@/lib/snapshot";

// 광고주 유형(병원/시술후기) 수동 지정 — 계정 단위 영구 저장, COLLECT_KEY 로 보호.
// 자동 분류가 틀린 계정을 관리자가 고정한다 (재수집·조회 시점 재계산보다 우선).
//  지정:  /api/advtype?key=KEY&handle=xxx&type=clinic|influencer
//  해제:  /api/advtype?key=KEY&handle=xxx&action=remove
//  목록:  /api/advtype?key=KEY
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const entry = (url.searchParams.get("handle") || url.searchParams.get("name") || "").trim();
  if (!entry) {
    return NextResponse.json({ overrides: await readAdvTypeOverrides() });
  }
  const action = url.searchParams.get("action") || "set";
  const type = url.searchParams.get("type");
  if (action !== "remove" && type !== "clinic" && type !== "influencer") {
    return NextResponse.json({ error: "type must be clinic|influencer" }, { status: 400 });
  }
  const overrides = await setAdvTypeOverride(
    entry,
    action === "remove" ? null : (type as AdvType)
  );
  return NextResponse.json({ ok: true, action, entry, overrides });
}
