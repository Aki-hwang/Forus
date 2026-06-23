"use client";

// 관리자(?key=) 전용: 받은 문의 목록 + 삭제.
import { useCallback, useEffect, useState } from "react";

interface Inq {
  id: string;
  name: string;
  contact?: string;
  message: string;
  createdAt: string;
}

export function AdminInquiries({ adminKey }: { adminKey: string }) {
  const [items, setItems] = useState<Inq[] | null>(null);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/inquiry?key=${encodeURIComponent(adminKey)}`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.inquiries) ? d.inquiries : []))
      .catch(() => setItems([]));
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const del = async (id: string) => {
    if (!confirm("이 문의를 삭제할까요?")) return;
    setBusy(id);
    try {
      await fetch(
        `/api/inquiry/manage?key=${encodeURIComponent(adminKey)}&action=delete&id=${encodeURIComponent(id)}`,
        { method: "POST" }
      );
      load();
    } finally {
      setBusy(null);
    }
  };

  if (items === null) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-surface p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <p className="text-[13px] font-bold text-foreground">
          ✉️ 문의 <span className="text-muted">({items.length})</span>
        </p>
        <span className="text-[12px] text-muted">{open ? "▲ 접기" : "▼ 펼치기"}</span>
      </button>

      {open ? (
        items.length === 0 ? (
          <p className="mt-3 text-[12px] text-muted">아직 받은 문의가 없어요.</p>
        ) : (
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {items.map((q) => (
              <div key={q.id} className="flex items-start gap-3 bg-background px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-foreground">
                    {q.name}
                    <span className="ml-2 text-[11px] font-medium text-muted">
                      {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </p>
                  {q.contact ? (
                    <p className="text-[12px] font-medium text-primary-ink">{q.contact}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-[12px] text-foreground">{q.message}</p>
                </div>
                <button
                  onClick={() => del(q.id)}
                  disabled={busy !== null}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[12px] font-bold text-muted transition hover:text-foreground disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
