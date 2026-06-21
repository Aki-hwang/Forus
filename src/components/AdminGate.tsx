"use client";

// 관리자 진입/종료 버튼. ?key= 를 수동으로 치지 않고 모달로 입력.
// 키 검증은 서버(/api/* ?key=)에서 하므로 여기선 값만 보관 + URL 동기화.
import { useState } from "react";

function syncUrl(k: string | null) {
  const u = new URL(window.location.href);
  if (k) u.searchParams.set("key", k);
  else u.searchParams.delete("key");
  window.history.replaceState({}, "", u.toString());
}

export function AdminGate({
  manageKey,
  onSet,
}: {
  manageKey: string | null;
  onSet: (k: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");

  if (manageKey) {
    return (
      <button
        onClick={() => {
          onSet(null);
          syncUrl(null);
        }}
        className="text-[12px] text-muted underline-offset-2 transition hover:text-foreground hover:underline"
      >
        관리자 모드 종료
      </button>
    );
  }

  const enter = () => {
    const k = val.trim();
    if (!k) return;
    onSet(k);
    syncUrl(k);
    setOpen(false);
    setVal("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[12px] text-muted underline-offset-2 transition hover:text-foreground hover:underline"
      >
        관리자
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[14px] font-bold text-foreground">관리자 진입</p>
            <p className="mt-0.5 text-[12px] text-muted">관리자 키를 입력하세요.</p>
            <input
              type="password"
              value={val}
              autoFocus
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enter();
              }}
              placeholder="관리자 키"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/50"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border py-2 text-[13px] font-bold text-muted transition hover:text-foreground"
              >
                취소
              </button>
              <button
                onClick={enter}
                className="flex-1 rounded-lg bg-foreground py-2 text-[13px] font-bold text-white transition hover:opacity-90"
              >
                진입
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
