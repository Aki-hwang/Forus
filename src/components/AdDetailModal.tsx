"use client";

import { useEffect, useRef } from "react";
import { Ad } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";
import { confidentTreatment, displayHashtags } from "@/lib/treatments";
import { useUiLang } from "@/lib/i18n";

export function AdDetailModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const { t, tArea, tTreatment, tClinic } = useUiLang();
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

  // 모바일 뒤로가기 = 모달 닫기 — 인앱 브라우저·Android에서 뒤로가기가 사이트 이탈이 되지 않게.
  // 열릴 때 히스토리를 한 칸 쌓고, popstate(뒤로가기)면 닫는다. X·배경 클릭으로 닫힐 땐
  // 쌓아둔 칸을 back()으로 정리해 히스토리가 오염되지 않게 한다.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    let closedByPop = false;
    let pushed = false;
    // pushState 를 태스크로 미뤄 StrictMode 이중 mount(즉시 cleanup)에서 취소 가능하게 —
    // 안 그러면 cleanup 의 back() 이 재마운트 직후 popstate 로 돌아와 모달이 스스로 닫힌다.
    const id = setTimeout(() => {
      window.history.pushState({ adModal: true }, "");
      pushed = true;
    }, 0);
    const onPop = () => {
      closedByPop = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      clearTimeout(id);
      window.removeEventListener("popstate", onPop);
      // X·배경 클릭으로 닫힐 땐 쌓아둔 히스토리 칸을 정리 (popstate 리스너는 이미 제거됨)
      if (pushed && !closedByPop && window.history.state?.adModal) window.history.back();
    };
  }, []);

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
          aria-label={t("close")}
        >
          ✕
        </button>

        <CreativeCard
          palette={ad.palette}
          headline={ad.headline}
          sub={ad.sub}
          clinicName={tClinic(ad.clinic, ad.igUsername)}
          treatmentLabel={sureTreatment ? tTreatment(sureTreatment) : ""}
          lang={ad.lang}
          imageUrl={ad.imageUrl}
          kind={ad.kind}
        />

        <div className="space-y-2 p-5 text-[13px]">
          <p className="font-bold text-foreground">{tClinic(ad.clinic, ad.igUsername)}</p>
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
                <span>📍 {tArea(ad.area)}</span>
                {ad.views != null ? (
                  <span>▶ {ad.views.toLocaleString()} {t("viewsUnit")}</span>
                ) : null}
                <span>📅 {t("activeDaysRan", { n: ad.activeDays ?? 0 })}</span>
                {ad.platforms?.length ? (
                  <span>{ad.platforms.slice(0, 2).join(" · ")}</span>
                ) : null}
              </>
            ) : (
              <>
                <span>♡ {ad.likes.toLocaleString()}</span>
                <span>🔖 {ad.saves.toLocaleString()}</span>
                <span>📍 {tArea(ad.area)}</span>
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
                    {t("viewPost")}
                  </a>
                ) : null}
                {acctUrl ? (
                  <a
                    href={acctUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-muted hover:underline"
                  >
                    {t("viewAccount", { h: ad.igUsername ?? "" })}
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
