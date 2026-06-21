"use client";

// 관리자(?key=) 전용: 병원 등록 요청 목록.
import { useEffect, useState } from "react";

interface Req {
  id: string;
  clinic: string;
  instagram: string;
  area?: string;
  contact?: string;
  message?: string;
  createdAt: string;
}

export function AdminRequests({ adminKey }: { adminKey: string }) {
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/register-request?key=${encodeURIComponent(adminKey)}`)
      .then((r) => r.json())
      .then((d) => setReqs(Array.isArray(d.requests) ? d.requests : []))
      .catch(() => setReqs([]));
  }, [adminKey]);

  if (reqs === null) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-surface p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <p className="text-[13px] font-bold text-foreground">
          📥 병원 등록 요청 <span className="text-muted">({reqs.length})</span>
        </p>
        <span className="text-[12px] text-muted">{open ? "▲ 접기" : "▼ 펼치기"}</span>
      </button>

      {open ? (
        reqs.length === 0 ? (
          <p className="mt-3 text-[12px] text-muted">아직 등록 요청이 없어요.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {reqs.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border bg-background p-3 text-[12px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-foreground">
                    {r.clinic}
                    {r.area ? <span className="ml-1 text-muted">· {r.area}</span> : null}
                  </p>
                  <p className="shrink-0 text-[11px] text-muted">
                    {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <a
                  href={
                    r.instagram.startsWith("http")
                      ? r.instagram
                      : `https://instagram.com/${r.instagram.replace(/^@/, "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-medium text-primary-ink hover:underline"
                >
                  {r.instagram}
                </a>
                {r.contact ? <p className="mt-0.5 text-muted">연락처: {r.contact}</p> : null}
                {r.message ? <p className="mt-1 text-foreground">{r.message}</p> : null}
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
