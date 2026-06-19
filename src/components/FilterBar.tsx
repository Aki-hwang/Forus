"use client";

import { Area, AREAS } from "@/lib/ads";

export function FilterBar({
  area,
  onArea,
  resultCount,
}: {
  area: Area | "전체";
  onArea: (a: Area | "전체") => void;
  resultCount: number;
}) {
  const areaTabs: (Area | "전체")[] = ["전체", ...AREAS];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* 지역 탭 */}
      <div className="inline-flex rounded-xl border border-border bg-surface p-1">
        {areaTabs.map((a) => (
          <button
            key={a}
            onClick={() => onArea(a)}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-bold transition ${
              area === a
                ? "bg-foreground text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-muted">
        총 <span className="font-bold text-foreground">{resultCount}</span>건 · 조회수순
      </p>
    </div>
  );
}
