import { NextResponse } from "next/server";
import { addInquiry, readInquiries } from "@/lib/snapshot";
import { notifyTelegram } from "@/lib/notify";

export const dynamic = "force-dynamic";
const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const name = clip(body.name, 60);
  const contact = clip(body.contact, 120);
  const message = clip(body.message, 1000);
  // 연락처 필수 — 회신 불가능한 문의는 리드가 아니다
  if (!name || !contact || !message) {
    return NextResponse.json(
      { error: "missing_fields", message: "이름, 연락처, 문의 내용은 필수입니다." },
      { status: 400 }
    );
  }
  try {
    const entry = await addInquiry({ name, contact, message });
    void notifyTelegram(`📩 DermaRadar 문의\n이름: ${name}\n연락처: ${contact}\n\n${message}`);
    return NextResponse.json({ ok: true, id: entry.id });
  } catch (e) {
    return NextResponse.json({ error: "save_failed", detail: String(e) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const list = await readInquiries();
  return NextResponse.json({ count: list.length, inquiries: list });
}
