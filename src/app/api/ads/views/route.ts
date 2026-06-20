import { NextResponse } from "next/server";
import { readSnapshot } from "@/lib/snapshot";

// 조회수는 수집 시 이미 스냅샷에 반영됨 → 스냅샷만 반환(무료).
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await readSnapshot("ads");
  return NextResponse.json({ source: snap ? "apify" : "sample", ads: snap?.ads ?? [] });
}
