"use client";

import { Area, AREAS } from "@/lib/ads";

export type SortKey = "views" | "followers" | "recent" | "activeDays";
export type KindKey = "전체" | "ad" | "organic";

const SORTS: [SortKey, string][] = [
  ["recent", "최신순"],
  ["views", "조회수순"],
  ["followers", "팔로워순"],
];

const KINDS: [KindKey, string][] = [
  ["전체", "전체"],
  ["ad", "유료"],
  ["organic", "무료"],
];

export function FilterBar({
  area,
  onArea,
  sort,
  onSort,
  kind,
  onKind,
  resultCount,
}: {
  area: Area | "전체";
  onArea: (a: Area | "전체") => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  kind: KindKey;
  onKind: (k: KindKey) => void;
  resultCount: number;
}) {
  const areaTabs: (Area | "전체")[] = ["전체", ...AREAS];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex max-w-full items-center gap-2 overflow-x-auto sm:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 지역 탭 */}
        <div className="inline-flex shrink-0 rounded-xl border border-border bg-surface p-1">
          {areaTabs.map((a) => (
            <button
              key={a}
              onClick={() => onArea(a)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-bold transition sm:px-3.5 ${
                area === a
                  ? "bg-foreground text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* 유료/오가닉 토글 */}
        <div className="inline-flex shrink-0 rounded-xl border border-border bg-surface p-1">
          {KINDS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onKind(key)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${
                kind === key
                  ? "bg-accent/15 text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 정렬 + 건수 */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={`rounded-lg px-2.5 py-1.5 text-[13px] font-bold transition ${
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
