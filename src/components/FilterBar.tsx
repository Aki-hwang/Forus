"use client";

import { Area, AREAS } from "@/lib/ads";
import { useUiLang } from "@/lib/i18n";

export type SortKey = "views" | "followers" | "recent" | "activeDays";
export type KindKey = "전체" | "ad" | "organic";

type TKey = "all" | "paid" | "free" | "sortRecent" | "sortViews" | "sortFollowers";
const SORTS: [SortKey, TKey][] = [
  ["recent", "sortRecent"],
  ["views", "sortViews"],
  ["followers", "sortFollowers"],
];
const KINDS: [KindKey, TKey][] = [
  ["전체", "all"],
  ["ad", "paid"],
  ["organic", "free"],
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
  const { t, tArea } = useUiLang();
  const areaTabs: (Area | "전체")[] = ["전체", ...AREAS];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex max-w-full items-center gap-2 overflow-x-auto sm:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex shrink-0 rounded-xl border border-border bg-surface p-1">
          {areaTabs.map((a) => (
            <button
              key={a}
              onClick={() => onArea(a)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition sm:px-3.5 ${
                area === a ? "bg-foreground text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {a === "전체" ? t("all") : tArea(a)}
            </button>
          ))}
        </div>

        <div className="inline-flex shrink-0 rounded-xl border border-border bg-surface p-1">
          {KINDS.map(([key, lk]) => (
            <button
              key={key}
              onClick={() => onKind(key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${
                kind === key ? "bg-accent/15 text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {t(lk)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {SORTS.map(([key, lk]) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-bold transition ${
                sort === key ? "bg-primary/10 text-primary-ink" : "text-muted hover:text-foreground"
              }`}
            >
              {t(lk)}
            </button>
          ))}
        </div>
        <p className="hidden text-[13px] text-muted sm:block">
          {t("totalCount", { n: resultCount })}
        </p>
      </div>
    </div>
  );
}
