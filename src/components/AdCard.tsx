"use client";

import { Ad, TREATMENT_LABEL } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

export function AdCard({
  ad,
  onSelect,
}: {
  ad: Ad;
  onSelect: (ad: Ad) => void;
}) {
  const isLive = ad.live === true;

  return (
    <div className="group block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div className="relative">
        <button onClick={() => onSelect(ad)} className="block w-full text-left">
          <CreativeCard
            palette={ad.palette}
            headline={ad.headline}
            sub={ad.sub}
            clinicName={ad.clinic.replace(/\s*\(.*\)$/, "")}
            treatmentLabel={TREATMENT_LABEL[ad.treatment][ad.lang === "JP" ? "jp" : "ko"]}
            lang={ad.lang}
            imageUrl={ad.imageUrl}
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100">
            <span className="mb-4 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-foreground shadow-lg">
              상세 보기
            </span>
          </div>
        </button>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-background px-2 py-0.5 text-[11px] font-bold text-muted">
              📍 {ad.area}
            </span>
            {ad.featured ? (
              <span
                title={ad.note}
                className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary-ink"
              >
                ⭐ 등록
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2.5 text-[11.5px] font-medium text-muted">
            {isLive ? (
              <>
                {ad.views != null ? (
                  <span title="인스타 릴스 조회수(중앙값)">▶ {fmt(ad.views)}</span>
                ) : ad.likes > 0 ? (
                  <span title="인스타 팔로워">👥 {fmt(ad.likes)}</span>
                ) : null}
                <span title="집행 일수">📅 {ad.activeDays ?? 0}일</span>
              </>
            ) : (
              <>
                <span>♡ {fmt(ad.likes)}</span>
                <span>🔖 {fmt(ad.saves)}</span>
              </>
            )}
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
    </div>
  );
}
