"use client";

import { Area, AREAS, TreatmentKey, TREATMENTS, TREATMENT_LABEL } from "@/lib/ads";

export function FilterBar({
  area,
  onArea,
  treatment,
  onTreatment,
  resultCount,
}: {
  area: Area | "전체";
  onArea: (a: Area | "전체") => void;
  treatment: TreatmentKey | "전체";
  onTreatment: (t: TreatmentKey | "전체") => void;
  resultCount: number;
}) {
  const areaTabs: (Area | "전체")[] = ["전체", ...AREAS];
  const treatmentChips: (TreatmentKey | "전체")[] = ["전체", ...TREATMENTS];

  return (
    <div className="space-y-3">
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
          총 <span className="font-bold text-foreground">{resultCount}</span>건의 광고
        </p>
      </div>

      {/* 시술 칩 */}
      <div className="flex flex-wrap gap-2">
        {treatmentChips.map((t) => {
          const label = t === "전체" ? "전체 시술" : TREATMENT_LABEL[t].ko;
          const active = treatment === t;
          return (
            <button
              key={t}
              onClick={() => onTreatment(t)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
                active
                  ? "border-primary bg-primary/10 font-bold text-primary-ink"
                  : "border-border bg-surface text-muted hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
