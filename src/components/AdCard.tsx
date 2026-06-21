"use client";

import { Ad, TREATMENT_LABEL } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

export function AdCard({
  ad,
  onSelect,
  onExclude,
  onBlock,
}: {
  ad: Ad;
  onSelect: (ad: Ad) => void;
  onExclude?: (ad: Ad) => void;
  onBlock?: (ad: Ad) => void;
}) {
  const isLive = ad.live === true;
  const isOrganic = ad.kind === "organic";

  return (
    <div className="group block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div className="relative">
        {onExclude || onBlock ? (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
            {onExclude ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExclude(ad);
                }}
                title="이 게시물만 이번 수집에서 제외 (다음 수집 때 다시 보임)"
                className="inline-flex h-6 items-center rounded-full bg-black/60 px-2.5 text-[11px] font-bold leading-none text-white shadow transition hover:bg-black/80"
              >
                제외
              </button>
            ) : null}
            {onBlock ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBlock(ad);
                }}
                title="이 계정 자체를 차단 (재수집해도 안 보임)"
                className="inline-flex h-6 items-center rounded-full bg-black/60 px-2.5 text-[11px] font-bold leading-none text-white shadow transition hover:bg-red-500"
              >
                🚫 차단
              </button>
            ) : null}
          </div>
        ) : null}
        <button onClick={() => onSelect(ad)} className="block w-full text-left">
          <CreativeCard
            palette={ad.palette}
            headline={ad.headline}
            sub={ad.sub}
            clinicName={ad.clinic.replace(/\s*\(.*\)$/, "")}
            treatmentLabel={TREATMENT_LABEL[ad.treatment][ad.lang === "JP" ? "jp" : "ko"]}
            lang={ad.lang}
            imageUrl={ad.imageUrl}
            kind={ad.kind}
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100">
            <span className="mb-4 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-foreground shadow-lg">
              상세 보기
            </span>
          </div>
        </button>
      </div>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-[13px] font-bold text-foreground">
          {ad.clinic.replace(/\s*\(.*\)$/, "")}
        </p>
        <div className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-muted">
          <span className="whitespace-nowrap rounded-md bg-background px-1.5 py-0.5 font-bold leading-none">
            📍 {ad.area}
          </span>
          {ad.featured ? (
            <span
              title={ad.note ? `등록 클리닉 · ${ad.note}` : "등록 클리닉"}
              className="whitespace-nowrap rounded-md bg-primary/10 px-1.5 py-0.5 font-bold leading-none text-primary-ink"
            >
              ⭐ 등록
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-2 whitespace-nowrap">
            {isOrganic ? (
              <>
                {ad.views != null ? <span title="릴스 조회수">▶ {fmt(ad.views)}</span> : null}
                <span title="좋아요">♡ {fmt(ad.likes)}</span>
              </>
            ) : isLive ? (
              <>
                {ad.views != null ? (
                  <span title="릴스 조회수(중앙값)">▶ {fmt(ad.views)}</span>
                ) : ad.likes > 0 ? (
                  <span title="팔로워">👥 {fmt(ad.likes)}</span>
                ) : null}
                <span title="집행 일수">📅 {ad.activeDays ?? 0}일</span>
              </>
            ) : (
              <>
                <span>♡ {fmt(ad.likes)}</span>
                <span>🔖 {fmt(ad.saves)}</span>
              </>
            )}
          </span>
        </div>
        <div className="flex gap-1 overflow-hidden">
          {(ad.hashtags && ad.hashtags.length ? ad.hashtags : ad.tags.map((t) => `#${t}`))
            .slice(0, 3)
            .map((t) => (
              <span
                key={t}
                className="max-w-[33%] shrink-0 truncate whitespace-nowrap text-[11px] font-medium text-primary-ink"
              >
                {t}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
