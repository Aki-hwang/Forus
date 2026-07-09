// 소비자 페이지 카드 컴포넌트 (서버 렌더 전용, 로케일 대응).
// CreativeCard(클라이언트·onError 폴백)와 달리 JS 없이 렌더되도록 단순 <img> 사용.

import { Ad } from "@/lib/ads";
import { confidentTreatment } from "@/lib/treatments";
import {
  ConsumerLocale,
  CONSUMER_UI,
  engagement,
  ConsumerClinic,
  guideByKey,
  areaByKey,
} from "@/lib/consumer";

function fmt(locale: ConsumerLocale, n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}${locale === "jp" ? "万" : "만"}`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

/** IG 게시물 카드 — 원본 게시물로 새 탭 링크 */
export function ConsumerPostCard({ locale, post }: { locale: ConsumerLocale; post: Ad }) {
  // imgCached:false = 캐시에 실물 없는 만료 이미지 — 깨진 아이콘 대신 그라데이션 폴백으로
  const proxied =
    post.imageUrl && post.imgCached !== false
      ? `/api/img?u=${encodeURIComponent(post.imageUrl)}`
      : null;
  const e = engagement(post);
  const isViews = typeof post.views === "number" && post.views > 0;
  // 시술 배지는 확신 분류일 때만, 재판정된 값으로 — 저장값은 기본값 폴백일 수 있다
  const sureTreatment = confidentTreatment(post);
  const treatmentName = sureTreatment ? guideByKey(locale, sureTreatment).name : null;

  return (
    <a
      href={post.sourceUrl ?? `https://www.instagram.com/${post.igUsername ?? ""}/`}
      target="_blank"
      rel="noopener noreferrer"
      data-oc="guide_post"
      className="group block overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={
          proxied
            ? undefined
            : {
                background: `linear-gradient(135deg, ${post.palette[0]}, ${post.palette[1]})`,
              }
        }
      >
        {proxied ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proxied}
            alt={treatmentName ? `${post.clinic} — ${treatmentName}` : post.clinic}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4">
            <p className="whitespace-pre-line text-center text-[15px] font-black leading-snug text-foreground/80">
              {post.headline}
            </p>
          </div>
        )}
        {treatmentName ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-bold text-white">
            {treatmentName}
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-[13.5px] font-bold text-foreground">
          @{post.igUsername ?? post.clinic}
        </p>
        <div className="flex items-center gap-2 text-[12px] font-medium text-muted">
          <span>📍 {areaByKey(locale, post.area).name}</span>
          <span className="ml-auto">
            {isViews ? `▶ ${fmt(locale, e)}` : e > 0 ? `♡ ${fmt(locale, e)}` : ""}
          </span>
        </div>
      </div>
    </a>
  );
}

/** 진행 중 프로모션(광고) 카드 */
export function ConsumerPromoCard({ locale, ad }: { locale: ConsumerLocale; ad: Ad }) {
  const ui = CONSUMER_UI[locale];
  // imgCached:false = 만료 이미지 — 깨진 아이콘 대신 그라데이션 박스 (이벤트 정보는 유지)
  const proxied =
    ad.imageUrl && ad.imgCached !== false
      ? `/api/img?u=${encodeURIComponent(ad.imageUrl)}`
      : null;
  const sureTreatment = confidentTreatment(ad);
  return (
    <a
      href={ad.sourceUrl ?? ad.adLibraryUrl ?? `https://www.instagram.com/${ad.igUsername ?? ""}/`}
      target="_blank"
      rel="noopener noreferrer"
      data-oc="guide_promo"
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div
        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"
        style={
          proxied
            ? undefined
            : { background: `linear-gradient(135deg, ${ad.palette[0]}, ${ad.palette[1]})` }
        }
      >
        {proxied ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proxied} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-foreground">{ad.headline}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {ad.clinic}
          {sureTreatment ? ` · ${guideByKey(locale, sureTreatment).name}` : ""}
        </p>
        <p className="mt-0.5 text-[11.5px] font-bold text-primary-ink">
          {ui.promoDay(ad.activeDays ?? 0)}
        </p>
      </div>
    </a>
  );
}

/** 클리닉 카드 — 인스타 프로필로 링크 */
export function ConsumerClinicCard({
  locale,
  clinic,
}: {
  locale: ConsumerLocale;
  clinic: ConsumerClinic;
}) {
  const ui = CONSUMER_UI[locale];
  // 카드 전체는 인스타 프로필로 (stretched-link 오버레이), LINE 직링크가 있으면 그 위(z-10)에
  // 별도 버튼 — <a> 중첩은 불가하므로 절대배치 패턴. 서버 컴포넌트 유지(JS 불필요).
  return (
    <div className="relative rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <a
        href={clinic.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`@${clinic.handle} Instagram`}
        data-oc="guide_clinic"
        className="absolute inset-0 rounded-2xl"
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black text-foreground">
            {locale === "ko" ? clinic.name : `@${clinic.handle}`}
          </p>
          <p className="mt-0.5 flex flex-wrap gap-1 text-[12px] text-muted">
            {locale === "ko" ? <span className="truncate">@{clinic.handle}</span> : null}
            {clinic.areas.map((a) => (
              <span key={a}>📍 {areaByKey(locale, a).name}</span>
            ))}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10.5px] font-bold text-primary-ink">
          Instagram →
        </span>
      </div>
      {clinic.badges.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {clinic.badges.map((b) => (
            <span
              key={b}
              className="rounded-md bg-background px-1.5 py-0.5 text-[10.5px] font-bold text-foreground/70"
            >
              {ui.badge[b]}
            </span>
          ))}
        </div>
      ) : null}
      {clinic.postCount > 0 ? (
        <p className="mt-2 text-[12px] text-muted">{ui.clinicPostCount(clinic.postCount)}</p>
      ) : null}
      {clinic.lineUrl ? (
        <a
          href={clinic.lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-oc="guide_clinic_line"
          className="relative z-10 mt-2.5 inline-flex items-center rounded-full border border-[#06C755]/40 bg-[#06C755]/10 px-3 py-1.5 text-[11.5px] font-bold text-[#06925f] transition hover:bg-[#06C755]/20"
        >
          {ui.clinicLine}
        </a>
      ) : null}
    </div>
  );
}
