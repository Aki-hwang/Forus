import { NextResponse } from "next/server";
import { removeAdById } from "@/lib/snapshot";

// 단일 게시물 제외(현재 스냅샷에서만). 차단(/api/block)과 달리 영구 아님 → 다음 수집 때 복귀.
// /api/exclude?key=COLLECT_KEY&id=...
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const removed = await removeAdById(id);
  return NextResponse.json({ ok: true, removed });
}
