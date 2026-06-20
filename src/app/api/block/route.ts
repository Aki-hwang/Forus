import { NextResponse } from "next/server";
import { addToBlocklist, removeFromBlocklist, readBlocklist } from "@/lib/snapshot";

// 저장본에서 계정 제외/복원 (Apify 재호출 없음). COLLECT_KEY 로 보호.
//  추가:  /api/block?key=KEY&handle=ohvelyjoo_hongdae_jp
//  복원:  /api/block?key=KEY&handle=...&action=remove
//  목록:  /api/block?key=KEY
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const entry = (url.searchParams.get("handle") || url.searchParams.get("name") || "").trim();
  const action = url.searchParams.get("action") || "add";
  if (!entry) {
    return NextResponse.json({ blocklist: await readBlocklist() });
  }
  const blocklist = action === "remove" ? await removeFromBlocklist(entry) : await addToBlocklist(entry);
  return NextResponse.json({ ok: true, action, entry, blocklist });
}
