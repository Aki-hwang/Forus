"use client";

import { Area, AREAS } from "@/lib/ads";
import { useUiLang } from "@/lib/i18n";

export type SortKey = "trending" | "views" | "followers" | "recent" | "activeDays";
/** 광고주 유형 필터 — 병원/인플루언서 (구 유료/무료 필터 대체) */
export type AdvKey = "전체" | "clinic" | "influencer";

type TKey = "all" | "clinicTab" | "influencer" | "sortTrending" | "sortRecent" | "sortViews" | "sortFollowers";
const SORTS: [SortKey, TKey][] = [
  ["trending", "sortTrending"],
  ["recent", "sortRecent"],
  ["views", "sortViews"],
  ["followers", "sortFollowers"],
];
// 기본 탭(시술후기)이 맨 앞 — 모바일 좁은 화면에서 활성 탭이 스크롤 밖으로 잘리지 않게
const ADVS: [AdvKey, TKey][] = [
  ["influencer", "influencer"],
  ["clinic", "clinicTab"],
  ["전체", "all"],
];

export function FilterBar({
  area,
  onArea,
  sort,
  onSort,
  adv,
  onAdv,
  resultCount,
}: {
  area: Area | "전체";
  onArea: (a: Area | "전체") => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  adv: AdvKey;
  onAdv: (k: AdvKey) => void;
  resultCount: number;
}) {
  const { t, tArea } = useUiLang();
  const areaTabs: (Area | "전체")[] = ["전체", ...AREAS];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* 모바일: 탭이 가로로 넘칠 때 스크롤 가능함을 알리는 우측 페이드 힌트 */}
      <div className="relative max-w-full sm:max-w-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent sm:hidden"
        />
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
          {ADVS.map(([key, lk]) => (
            <button
              key={key}
              onClick={() => onAdv(key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${
                adv === key ? "bg-accent/15 text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {t(lk)}
            </button>
          ))}
        </div>
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
