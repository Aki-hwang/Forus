import { NextResponse } from "next/server";
import { removeInquiry } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = url.searchParams.get("id");
  if (url.searchParams.get("action") === "delete" && id) {
    await removeInquiry(id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}
