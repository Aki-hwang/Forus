"use client";

// 지구본 언어 스위처 — UI 언어(한/일/중/영) 변경.
import { useState } from "react";
import { useUiLang, UI_LANGS } from "@/lib/i18n";

export function LangSwitcher() {
  const { lang, setLang } = useUiLang();
  const [open, setOpen] = useState(false);
  const current = UI_LANGS.find((l) => l.code === lang) ?? UI_LANGS[0];

  return (
    <div className="relative">
      {/* 지구본 아이콘만 — 현재 언어는 title·aria-label 로(툴팁·접근성), 드롭다운엔 ✓ 표시 */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Language — ${current.label}`}
        aria-label={`Language — ${current.label}`}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-foreground transition hover:bg-background"
      >
        <span aria-hidden="true">🌐</span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="animate-fadeup absolute right-0 top-[calc(100%+6px)] z-20 w-36 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            {UI_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`block w-full px-3.5 py-2.5 text-left text-[13px] font-medium transition hover:bg-background ${
                  l.code === lang ? "text-primary-ink" : "text-foreground"
                }`}
              >
                {l.code === lang ? "✓ " : ""}
                {l.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
