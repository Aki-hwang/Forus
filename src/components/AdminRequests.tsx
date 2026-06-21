"use client";

// 관리자(?key=) 전용: 병원 등록 요청 목록 + 처리(등록/삭제) + 승인된 병원 관리.
import { useCallback, useEffect, useState } from "react";

interface Req {
  id: string;
  clinic: string;
  instagram: string;
  area?: string;
  contact?: string;
  message?: string;
  createdAt: string;
}
interface Approved {
  name: string;
  handle: string;
  areas: string[];
  instagram: string;
  addedAt: string;
}

const igUrl = (s: string) =>
  s.startsWith("http") ? s : `https://instagram.com/${s.replace(/^@/, "")}`;

export function AdminRequests({ adminKey }: { adminKey: string }) {
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [approved, setApproved] = useState<Approved[]>([]);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/register-request?key=${encodeURIComponent(adminKey)}`)
      .then((r) => r.json())
      .then((d) => setReqs(Array.isArray(d.requests) ? d.requests : []))
      .catch(() => setReqs([]));
    fetch(`/api/register-request/manage?key=${encodeURIComponent(adminKey)}`)
      .then((r) => r.json())
      .then((d) => setApproved(Array.isArray(d.approved) ? d.approved : []))
      .catch(() => setApproved([]));
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const post = async (qs: string) => {
    setBusy(qs);
    try {
      await fetch(`/api/register-request/manage?key=${encodeURIComponent(adminKey)}&${qs}`, {
        method: "POST",
      });
      load();
    } finally {
      setBusy(null);
    }
  };

  if (reqs === null) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-surface p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <p className="text-[13px] font-bold text-foreground">
          📥 병원 등록 요청 <span className="text-muted">({reqs.length})</span>
        </p>
        <span className="text-[12px] text-muted">{open ? "▲ 접기" : "▼ 펼치기"}</span>
      </button>

      {open ? (
        <>
          {reqs.length === 0 ? (
            <p className="mt-3 text-[12px] text-muted">대기 중인 등록 요청이 없어요.</p>
          ) : (
            <div className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {reqs.map((r) => (
                <div key={r.id} className="flex items-center gap-3 bg-background px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-foreground">
                      {r.clinic}
                      {r.area ? <span className="ml-1 text-[11px] text-muted">· {r.area}</span> : null}
                      <span className="ml-2 text-[11px] font-medium text-muted">
                        {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </p>
                    <a
                      href={igUrl(r.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-[12px] font-medium text-primary-ink hover:underline"
                    >
                      {r.instagram}
                    </a>
                    {r.contact || r.message ? (
                      <p className="truncate text-[11px] text-muted">
                        {r.contact ? `연락처: ${r.contact}` : ""}
                        {r.contact && r.message ? " · " : ""}
                        {r.message ?? ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => post(`action=approve&id=${encodeURIComponent(r.id)}`)}
                      disabled={busy !== null}
                      className="rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      등록
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("이 요청을 삭제할까요?"))
                          post(`action=delete&id=${encodeURIComponent(r.id)}`);
                      }}
                      disabled={busy !== null}
                      className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-bold text-muted transition hover:text-foreground disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approved.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-bold text-muted">
                ✅ 등록된 병원 (워치리스트) — {approved.length}곳
              </p>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {approved.map((c) => (
                  <div key={c.handle} className="flex items-center gap-3 bg-background px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold text-foreground">
                        {c.name}
                        {c.areas[0] ? (
                          <span className="ml-1 text-[11px] text-muted">· {c.areas[0]}</span>
                        ) : null}
                      </p>
                      <a
                        href={igUrl(c.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[11px] text-primary-ink hover:underline"
                      >
                        @{c.handle}
                      </a>
                    </div>
                    <button
                      onClick={() =>
                        post(`action=unapprove&handle=${encodeURIComponent(c.handle)}`)
                      }
                      disabled={busy !== null}
                      className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted transition hover:text-foreground disabled:opacity-50"
                    >
                      해제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
