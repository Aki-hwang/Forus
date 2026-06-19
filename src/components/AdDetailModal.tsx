"use client";

import { useEffect } from "react";
import { Ad, TREATMENT_LABEL } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";

export function AdDetailModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="animate-fadeup relative my-auto w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-foreground transition hover:bg-black/20"
          aria-label="닫기"
        >
          ✕
        </button>

        <CreativeCard
          palette={ad.palette}
          headline={ad.headline}
          sub={ad.sub}
          clinicName={ad.clinic.replace(/\s*\(.*\)$/, "")}
          treatmentLabel={TREATMENT_LABEL[ad.treatment][ad.lang === "JP" ? "jp" : "ko"]}
          lang={ad.lang}
          imageUrl={ad.imageUrl}
        />

        <div className="space-y-2 p-5 text-[13px]">
          <p className="font-bold text-foreground">{ad.clinic}</p>
          {ad.caption ? (
            <p className="leading-relaxed text-muted">{ad.caption}</p>
          ) : null}
          {ad.hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {ad.hashtags.map((h) => (
                <span key={h} className="text-[12px] text-primary-ink">
                  {h}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[12px] font-medium text-muted">
            {ad.live ? (
              <>
                <span>📍 {ad.area}</span>
                {ad.views != null ? (
                  <span>▶ {ad.views.toLocaleString()} 조회</span>
                ) : null}
                <span>📅 {ad.activeDays ?? 0}일 집행</span>
                {ad.platforms?.length ? (
                  <span>{ad.platforms.slice(0, 2).join(" · ")}</span>
                ) : null}
              </>
            ) : (
              <>
                <span>♡ {ad.likes.toLocaleString()}</span>
                <span>🔖 {ad.saves.toLocaleString()}</span>
                <span>📍 {ad.area}</span>
              </>
            )}
          </div>
          {ad.sourceUrl ? (
            <a
              href={ad.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 pt-1 text-[12px] font-bold text-primary-ink hover:underline"
            >
              {ad.sourceUrl.includes("instagram.com")
                ? `↗ 인스타그램${ad.igUsername ? ` (@${ad.igUsername})` : ""} 보기`
                : "↗ 원본 광고 / 사이트 보기"}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
