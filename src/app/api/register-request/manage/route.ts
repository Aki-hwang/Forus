import { NextResponse } from "next/server";
import {
  readRegisterRequests,
  removeRegisterRequest,
  addApprovedClinic,
  readApprovedClinics,
  removeApprovedClinic,
} from "@/lib/snapshot";

// 관리자 전용(?key=COLLECT_KEY): 등록 요청 처리.
//  - action=approve&id=...  → 요청을 워치리스트(승인 병원)로 이동
//  - action=delete&id=...   → 요청 삭제(거절)
//  - action=unapprove&handle=... → 승인 병원에서 제거
//  - GET ?key= → 승인된 병원 목록
export const dynamic = "force-dynamic";

function handleFromInstagram(s: string): string {
  let h = (s || "").trim();
  if (h.startsWith("http")) {
    try {
      h = new URL(h).pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      /* keep */
    }
  }
  return h.replace(/^@/, "").trim().toLowerCase();
}

function authed(req: Request): boolean {
  const key = new URL(req.url).searchParams.get("key");
  const expected = process.env.COLLECT_KEY?.trim();
  return Boolean(expected && key === expected);
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const approved = await readApprovedClinics();
  return NextResponse.json({ count: approved.length, approved });
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const id = url.searchParams.get("id");
  const handle = url.searchParams.get("handle");

  if (action === "delete") {
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    await removeRegisterRequest(id);
    return NextResponse.json({ ok: true });
  }

  if (action === "unapprove") {
    if (!handle) return NextResponse.json({ error: "missing_handle" }, { status: 400 });
    await removeApprovedClinic(handle);
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    const reqs = await readRegisterRequests();
    const r = reqs.find((x) => x.id === id);
    if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const h = handleFromInstagram(r.instagram);
    if (!h) return NextResponse.json({ error: "bad_handle" }, { status: 400 });
    const areas = r.area && r.area !== "기타" ? [r.area] : [];
    await addApprovedClinic({
      name: r.clinic,
      handle: h,
      areas,
      instagram: r.instagram,
      addedAt: new Date().toISOString(),
    });
    await removeRegisterRequest(id);
    return NextResponse.json({ ok: true, handle: h });
  }

  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}
