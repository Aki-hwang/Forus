// 소비자 페이지 카드 컴포넌트 (서버 렌더 전용, 로케일 대응).
// CreativeCard(클라이언트·onError 폴백)와 달리 JS 없이 렌더되도록 단순 <img> 사용.

import { Ad } from "@/lib/ads";
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
  const proxied = post.imageUrl
    ? `/api/img?u=${encodeURIComponent(post.imageUrl)}`
    : null;
  const e = engagement(post);
  const isViews = typeof post.views === "number" && post.views > 0;
  const treatmentName = guideByKey(locale, post.treatment).name;

  return (
    <a
      href={post.sourceUrl ?? `https://www.instagram.com/${post.igUsername ?? ""}/`}
      target="_blank"
      rel="noopener noreferrer"
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
            alt={`${post.clinic} — ${treatmentName}`}
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
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-bold text-white">
          {treatmentName}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-[12.5px] font-bold text-foreground">
          @{post.igUsername ?? post.clinic}
        </p>
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted">
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
  const proxied = ad.imageUrl ? `/api/img?u=${encodeURIComponent(ad.imageUrl)}` : null;
  return (
    <a
      href={ad.sourceUrl ?? ad.adLibraryUrl ?? `https://www.instagram.com/${ad.igUsername ?? ""}/`}
      target="_blank"
      rel="noopener noreferrer"
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
        <p className="truncate text-[13px] font-bold text-foreground">{ad.headline}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted">
          {ad.clinic} · {guideByKey(locale, ad.treatment).name}
        </p>
        <p className="mt-0.5 text-[10.5px] font-bold text-primary-ink">
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
  return (
    <a
      href={clinic.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-black text-foreground">
            {locale === "ko" ? clinic.name : `@${clinic.handle}`}
          </p>
          <p className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-muted">
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
        <p className="mt-2 text-[11px] text-muted">{ui.clinicPostCount(clinic.postCount)}</p>
      ) : null}
    </a>
  );
}
