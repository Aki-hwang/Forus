import { NextResponse } from "next/server";
import { addRegisterRequest, readRegisterRequests } from "@/lib/snapshot";
import { notifyTelegram } from "@/lib/notify";

// 병원 인스타 등록 요청.
//  - POST: 공개 폼에서 제출 → /data 에 저장.
//  - GET ?key=COLLECT_KEY : 관리자 목록 조회.
export const dynamic = "force-dynamic";

const clip = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const clinic = clip(body.clinic, 80);
  const instagram = clip(body.instagram, 200);
  const area = clip(body.area, 20);
  const contact = clip(body.contact, 120);
  const message = clip(body.message, 500);

  if (!clinic || !instagram) {
    return NextResponse.json(
      { error: "missing_fields", message: "병원명과 인스타그램은 필수입니다." },
      { status: 400 }
    );
  }

  try {
    const entry = await addRegisterRequest({ clinic, instagram, area, contact, message });
    void notifyTelegram(
      [
        "🏥 DermaRadar 인스타 등록 요청",
        `병원: ${clinic}`,
        `인스타: ${instagram}`,
        area && `지역: ${area}`,
        contact && `연락처: ${contact}`,
        message && `\n${message}`,
      ]
        .filter(Boolean)
        .join("\n")
    );
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
  const list = await readRegisterRequests();
  return NextResponse.json({ count: list.length, requests: list });
}
