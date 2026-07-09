"use client";

import { Ad } from "@/lib/ads";
import { CreativeCard } from "./CreativeCard";
import { confidentTreatment, displayHashtags } from "@/lib/treatments";
import { hasSponsorDisclosure } from "@/lib/clinics";
import { useUiLang } from "@/lib/i18n";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

export function AdCard({
  ad,
  onSelect,
  onExclude,
  onBlock,
  onToggleType,
  runsAds,
}: {
  ad: Ad;
  onSelect: (ad: Ad) => void;
  onExclude?: (ad: Ad) => void;
  onBlock?: (ad: Ad) => void;
  /** 관리 모드: 광고주 유형(병원↔시술후기) 전환 — 계정 단위로 영구 저장 */
  onToggleType?: (ad: Ad) => void;
  /** 이 오가닉 게시물의 계정이 Meta 광고도 집행 중 — 투명성 배지 */
  runsAds?: boolean;
}) {
  const { t, tArea, tTreatment, tClinic } = useUiLang();
  const isLive = ad.live === true;
  const isOrganic = ad.kind === "organic";
  // 배지는 재판정된 시술을 표시 — 레거시 데이터는 저장값(기본값 폴백)과 다를 수 있다
  const sureTreatment = confidentTreatment(ad);
  // 협찬 자기표기 감지 — '광고를 광고라고 말해주는' 투명성 배지 (시술후기 카드 한정).
  // 분류용 hasSponsorSignal 은 '내돈내산·꿀팁' 같은 후기 어투 신호가 섞여 있어 쓰면 안 된다
  // (비협찬 선언 후기에 협찬 배지가 붙는 오탐) — 명시적 공개 문구만 보는 함수를 쓴다.
  const isSponsored =
    ad.advertiserType === "influencer" &&
    hasSponsorDisclosure(`${ad.caption ?? ""} ${(ad.hashtags ?? []).join(" ")}`);

  return (
    <div className="group block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div className="relative">
        {onExclude || onBlock || onToggleType ? (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
            {onToggleType ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleType(ad);
                }}
                title={t("advToggleTip")}
                className="inline-flex h-6 items-center rounded-full bg-black/60 px-2.5 text-[11px] font-bold leading-none text-white shadow transition hover:bg-primary"
              >
                {(ad.advertiserType ?? "clinic") === "clinic" ? t("advToReview") : t("advToClinic")}
              </button>
            ) : null}
            {onExclude ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExclude(ad);
                }}
                title={t("excludeTip")}
                className="inline-flex h-6 items-center rounded-full bg-black/60 px-2.5 text-[11px] font-bold leading-none text-white shadow transition hover:bg-black/80"
              >
                {t("exclude")}
              </button>
            ) : null}
            {onBlock ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBlock(ad);
                }}
                title={t("blockTip")}
                className="inline-flex h-6 items-center rounded-full bg-black/60 px-2.5 text-[11px] font-bold leading-none text-white shadow transition hover:bg-red-500"
              >
                {t("block")}
              </button>
            ) : null}
          </div>
        ) : null}
        <button onClick={() => onSelect(ad)} className="block w-full text-left">
          <CreativeCard
            palette={ad.palette}
            headline={ad.headline}
            sub={ad.sub}
            clinicName={tClinic(ad.clinic, ad.igUsername)}
            treatmentLabel={sureTreatment ? tTreatment(sureTreatment) : ""}
            lang={ad.lang}
            badge={
              ad.advertiserType === "influencer"
                ? // 결합 라벨은 절대배치 배지 폭을 넘쳐 언어 칩과 겹친다 — 짧은 단일 라벨로
                  isSponsored
                  ? t("sponsoredReview")
                  : t("influencer")
                : undefined
            }
            imageUrl={ad.imageUrl}
            kind={ad.kind}
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100">
            <span className="mb-4 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-foreground shadow-lg">
              {t("detailView")}
            </span>
          </div>
        </button>
      </div>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-[15px] font-black text-foreground">
          {tClinic(ad.clinic, ad.igUsername)}
        </p>
        <div className="flex flex-wrap items-center gap-1 text-[12px] font-medium text-muted">
          <span className="whitespace-nowrap rounded-md bg-background px-1.5 py-0.5 font-bold leading-none">
            📍 {tArea(ad.area)}
          </span>
          {ad.featured ? (
            <span
              title={ad.note ? `등록 클리닉 · ${ad.note}` : "등록 클리닉"}
              className="whitespace-nowrap rounded-md bg-primary/10 px-1.5 py-0.5 font-bold leading-none text-primary-ink"
            >
              {t("registered")}
            </span>
          ) : null}
          {runsAds ? (
            <span
              title={t("runsAdsTip")}
              className="whitespace-nowrap rounded-md bg-amber-100 px-1.5 py-0.5 font-bold leading-none text-amber-700"
            >
              {t("runsAds")}
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
                <span title="집행 일수">📅 {ad.activeDays ?? 0}{t("dayUnit")}</span>
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
          {displayHashtags(ad)
            .slice(0, 3)
            .map((t) => (
              <span
                key={t}
                className="max-w-[33%] shrink-0 truncate whitespace-nowrap text-[12px] font-medium text-primary-ink"
              >
                {t}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
