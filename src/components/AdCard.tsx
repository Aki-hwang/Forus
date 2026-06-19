"use client";

import { Ad, TREATMENT_LABEL } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

export function AdCard({
  ad,
  onGenerate,
}: {
  ad: Ad;
  onGenerate: (ad: Ad) => void;
}) {
  const href = ad.sourceUrl;
  const isLive = ad.live === true;

  const creative = (
    <CreativeCard
      palette={ad.palette}
      headline={ad.headline}
      sub={ad.sub}
      clinicName={ad.clinic.replace(/\s*\(.*\)$/, "")}
      treatmentLabel={TREATMENT_LABEL[ad.treatment][ad.lang === "JP" ? "jp" : "ko"]}
      lang={ad.lang}
    />
  );

  const overlay = (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100">
      <span className="mb-4 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-foreground shadow-lg">
        {href ? "↗ 원본 광고 보기" : "✨ 이 광고로 우리 광고 만들기"}
      </span>
    </div>
  );

  return (
    <div className="group block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div className="relative">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block">
            {creative}
            {overlay}
          </a>
        ) : (
          <button onClick={() => onGenerate(ad)} className="block w-full text-left">
            {creative}
            {overlay}
          </button>
        )}

        {/* 우리 광고 생성 (원본 이동과 별개로 항상 제공) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGenerate(ad);
          }}
          title="이 광고로 우리 광고 만들기"
          className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm backdrop-blur transition hover:bg-white"
        >
          ✨ 생성
        </button>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-background px-2 py-0.5 text-[11px] font-bold text-muted">
            📍 {ad.area}
          </span>
          <div className="flex items-center gap-2.5 text-[11.5px] font-medium text-muted">
            {isLive ? (
              <>
                {ad.platforms?.includes("INSTAGRAM") ? <span title="인스타 노출">IG</span> : null}
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
