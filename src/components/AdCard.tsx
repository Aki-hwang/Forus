"use client";

import { Ad, TREATMENT_LABEL } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

export function AdCard({ ad, onClick }: { ad: Ad; onClick: (ad: Ad) => void }) {
  return (
    <button
      onClick={() => onClick(ad)}
      className="group block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="relative">
        <CreativeCard
          palette={ad.palette}
          headline={ad.headline}
          sub={ad.sub}
          clinicName={ad.clinic.replace(/\s*\(.*\)$/, "")}
          treatmentLabel={TREATMENT_LABEL[ad.treatment][ad.lang === "JP" ? "jp" : "ko"]}
          lang={ad.lang}
        />
        {/* hover CTA */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100">
          <span className="mb-4 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-foreground shadow-lg">
            ✨ 이 광고로 우리 광고 만들기
          </span>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-background px-2 py-0.5 text-[11px] font-bold text-muted">
            📍 {ad.area}
          </span>
          <div className="flex items-center gap-2.5 text-[11.5px] font-medium text-muted">
            <span>♡ {fmt(ad.likes)}</span>
            <span>🔖 {fmt(ad.saves)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {ad.tags.map((t) => (
            <span key={t} className="text-[11px] font-medium text-primary-ink">
              #{t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
