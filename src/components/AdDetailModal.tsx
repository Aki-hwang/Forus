"use client";

import { useEffect } from "react";
import { Ad, TREATMENT_LABEL } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";
import { confidentTreatment, displayHashtags } from "@/lib/treatments";

export function AdDetailModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  // 배지는 재판정된 시술을 표시 — 레거시 데이터는 저장값(기본값 폴백)과 다를 수 있다
  const sureTreatment = confidentTreatment(ad);
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
          treatmentLabel={sureTreatment ? TREATMENT_LABEL[sureTreatment][ad.lang === "JP" ? "jp" : "ko"] : ""}
          lang={ad.lang}
          imageUrl={ad.imageUrl}
          kind={ad.kind}
        />

        <div className="space-y-2 p-5 text-[13px]">
          <p className="font-bold text-foreground">{ad.clinic}</p>
          {ad.caption ? (
            <p className="leading-relaxed text-muted">{ad.caption}</p>
          ) : null}
          {displayHashtags(ad).length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {displayHashtags(ad).map((h) => (
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
          {(() => {
            const acctUrl = ad.igUsername
              ? `https://www.instagram.com/${ad.igUsername}/`
              : undefined;
            // 게시물 permalink 판별 (프로필 URL 과 구분) — /p/ ·/reel/ ·/tv/
            const isPost = (u?: string) => Boolean(u && /instagram\.com\/(p|reel|tv)\//.test(u));
            // '이 게시물 보기'는 "실제 인스타 게시물 permalink" 가 있을 때만.
            //  광고는 단일 IG 게시물이 없어(Meta 광고 시스템에만 존재) 링크를 숨기고 계정 링크만
            //  둔다 — 계정·Meta 라이브러리 같은 엉뚱한 곳으로 보내지 않기 위함.
            const postUrl = isPost(ad.sourceUrl) ? ad.sourceUrl : undefined;
            return (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                {postUrl ? (
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-primary-ink hover:underline"
                  >
                    ↗ 이 게시물 보기
                  </a>
                ) : null}
                {acctUrl ? (
                  <a
                    href={acctUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-muted hover:underline"
                  >
                    인스타그램 (@{ad.igUsername}) 보기
                  </a>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
