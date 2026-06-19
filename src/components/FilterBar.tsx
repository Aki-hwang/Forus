"use client";

import { Area, AREAS } from "@/lib/ads";

export type SortKey = "views" | "followers" | "recent" | "activeDays";

const SORTS: [SortKey, string][] = [
  ["views", "조회수순"],
  ["followers", "팔로워순"],
  ["recent", "최신순"],
  ["activeDays", "집행기간순"],
];

export function FilterBar({
  area,
  onArea,
  sort,
  onSort,
  resultCount,
}: {
  area: Area | "전체";
  onArea: (a: Area | "전체") => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
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

      {/* 정렬 + 건수 */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold transition ${
                sort === key
                  ? "bg-primary/10 text-primary-ink"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="hidden text-[13px] text-muted sm:block">
          총 <span className="font-bold text-foreground">{resultCount}</span>건
        </p>
      </div>
    </div>
  );
}
