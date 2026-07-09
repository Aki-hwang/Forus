// 소비자 가이드 페이지 렌더러 + 메타데이터 빌더 — /jp·/ko 라우트가 공유하는 본체.
// 라우트 파일은 로케일만 지정하는 얇은 래퍼로 유지한다.

import type { Metadata } from "next";
import Link from "next/link";
import {
  ConsumerLocale,
  CONSUMER_UI,
  TREATMENT_GUIDES,
  AREA_GUIDES,
  TreatmentGuide,
  AreaGuide,
  loadConsumerData,
  treatmentCounts,
  filterPosts,
  dailyRotation,
  statsFor,
  clinicsFor,
  altLanguages,
} from "@/lib/consumer";
import {
  ConsumerPostCard,
  ConsumerPromoCard,
  ConsumerClinicCard,
  LINE_PILL_CLS,
} from "./ConsumerCards";
import { ConsumerFaq, FaqJsonLd, BreadcrumbJsonLd } from "./ConsumerFaq";
import { GimpoCta } from "./GimpoCta";

const BASE = "https://www.dermaradar.kr";

// ---------- 메타데이터 빌더 ----------

export function landingMetadata(locale: ConsumerLocale): Metadata {
  const ui = CONSUMER_UI[locale];
  return {
    title: ui.meta.landingTitle,
    description: ui.meta.landingDesc,
    alternates: { canonical: `/${locale}`, languages: altLanguages("") },
  };
}

export function treatmentMetadata(locale: ConsumerLocale, g: TreatmentGuide): Metadata {
  const ui = CONSUMER_UI[locale];
  return {
    title: ui.meta.treatmentTitle(g),
    description: ui.meta.treatmentDesc(g),
    alternates: {
      canonical: `/${locale}/${g.slug}`,
      languages: altLanguages(`/${g.slug}`),
    },
  };
}

export function comboMetadata(
  locale: ConsumerLocale,
  g: TreatmentGuide,
  a: AreaGuide
): Metadata {
  const ui = CONSUMER_UI[locale];
  return {
    title: ui.meta.comboTitle(g, a),
    description: ui.meta.comboDesc(g, a),
    alternates: {
      canonical: `/${locale}/${g.slug}/${a.slug}`,
      languages: altLanguages(`/${g.slug}/${a.slug}`),
    },
  };
}

// ---------- 공통 조각 ----------

function InfoCards({ locale, g }: { locale: ConsumerLocale; g: TreatmentGuide }) {
  const ui = CONSUMER_UI[locale];
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {[
        [ui.infoTime, g.time],
        [ui.infoDowntime, g.downtime],
        [ui.infoTip, g.tip],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-[12.5px] font-black text-muted">{label}</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-foreground">{value}</p>
        </div>
      ))}
    </section>
  );
}

/** 광고 자기표기 배지 — 일본 스테마 규제·표시광고법 대응 (김포 블록·배너 공용) */
function PrBadge({ label, small }: { label: string; small?: boolean }) {
  return (
    <span
      className={`rounded bg-foreground/10 px-1.5 py-0.5 font-bold normal-case tracking-normal text-muted ${
        small ? "text-[9.5px]" : "text-[10px]"
      }`}
    >
      {label}
    </span>
  );
}

function GimpoBlock({ locale }: { locale: ConsumerLocale }) {
  const g = CONSUMER_UI[locale].gimpo;
  return (
    <section className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-accent/5 p-5">
      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-primary-ink">
        {g.tag}
        <PrBadge label={g.prLabel} />
      </p>
      {/* break-keep: 한국어·CJK가 단어 중간에서 줄바꿈되지 않게 */}
      <h2 className="mt-1 break-keep text-[17px] font-black text-foreground">{g.title}</h2>
      <p className="mt-2 max-w-3xl break-keep text-[13px] leading-relaxed text-muted">{g.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <GimpoCta
          href={g.href}
          label={g.cta}
          locale={locale}
          page="landing"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition hover:opacity-90"
        />
        <GimpoCta
          href={g.lineHref}
          label={g.lineCta}
          locale={locale}
          page="landing"
          cta="line"
          className={`${LINE_PILL_CLS} inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px]`}
        />
      </div>
      {/* 운영 주체·무료 이유 공시 — 신뢰와 규제 대응을 겸한다 */}
      <p className="mt-3 max-w-3xl break-keep text-[11px] leading-relaxed text-muted/80">
        {g.disclosure}
      </p>
    </section>
  );
}

/**
 * 김포 CTA 컴팩트 배너 — 시술·시술×지역 딥페이지용.
 * SEO 유입은 랜딩이 아니라 딥페이지로 착지하므로, 랜딩에만 있던 유앤아이 김포 CTA 를
 * 구매의도가 가장 높은 페이지에도 노출한다 (1줄 배너로 본문 흐름을 해치지 않게).
 */
function GimpoBanner({
  locale,
  page,
  treatment,
}: {
  locale: ConsumerLocale;
  page: "treatment" | "combo";
  treatment?: string;
}) {
  const g = CONSUMER_UI[locale].gimpo;
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-accent/5 px-5 py-4">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wide text-primary-ink">
          {g.tag}
          <PrBadge label={g.prLabel} small />
        </p>
        <p className="mt-0.5 break-keep text-[14.5px] font-black text-foreground">{g.title}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <GimpoCta
          href={g.href}
          label={g.cta}
          locale={locale}
          page={page}
          treatment={treatment}
          className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition hover:opacity-90"
        />
        <GimpoCta
          href={g.lineHref}
          label={g.lineCta}
          locale={locale}
          page={page}
          treatment={treatment}
          cta="line"
          className={`${LINE_PILL_CLS} px-4 py-2 text-[12.5px]`}
        />
      </div>
    </section>
  );
}

// ---------- 랜딩 ----------

export async function ConsumerLanding({ locale }: { locale: ConsumerLocale }) {
  const ui = CONSUMER_UI[locale];
  const data = await loadConsumerData(locale);
  const counts = treatmentCounts(data);
  // 일별 로테이션 — 인기 상위 + 최근 7일 게시물 풀에서 매일 다른 배치 (KST 자정 회전, 최근 글 슬롯 보장)
  const topPosts = dailyRotation(data.posts, { take: 8, freshSlots: 2 });
  const promos = dailyRotation(data.ads, { pool: 12, take: 6, freshSlots: 2 });

  return (
    <div className="space-y-10">
      <FaqJsonLd items={ui.faq} />

      {/* 히어로 */}
      <section className="pt-2 text-center sm:pt-6">
        <h1 className="text-[26px] font-black leading-tight tracking-tight text-foreground sm:text-[34px]">
          {ui.heroPre}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {ui.heroHi}
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-[16px]">
          {ui.heroDesc}
          <strong className="text-foreground">{ui.heroStrong}</strong>
          {ui.heroTail}
        </p>
      </section>

      {/* 시술에서 찾기 */}
      <section id="treatments" className="space-y-3 scroll-mt-20">
        <h2 className="text-[18px] font-black text-foreground">{ui.secTreatments}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TREATMENT_GUIDES[locale].map((g) => (
            <Link
              key={g.slug}
              href={`/${locale}/${g.slug}`}
              className="group rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
            >
              <p className="text-[15px] font-black text-foreground group-hover:text-primary-ink">
                {g.name}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-muted">{g.alt}</p>
              <p className="mt-2 text-[12.5px] font-bold text-primary-ink">
                {ui.recentPosts(counts.get(g.key) ?? 0)} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 진행 중 이벤트 (ko 랜딩 전용 — 이벤트 레이더 포지셔닝) */}
      {ui.showPromosOnLanding && promos.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">{ui.secPromos}</h2>
            <span className="text-[11.5px] text-muted">{ui.promosHint}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((ad) => (
              <ConsumerPromoCard key={ad.id} locale={locale} ad={ad} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 지역에서 찾기 */}
      <section id="areas" className="space-y-3 scroll-mt-20">
        <h2 className="text-[18px] font-black text-foreground">{ui.secAreas}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {AREA_GUIDES[locale].map((a) => (
            <div key={a.slug} className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-[16px] font-black text-foreground">
                {a.name} <span className="text-[12px] font-bold text-muted">({a.sub})</span>
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{a.desc}</p>
              <p className="mt-1.5 text-[12.5px] text-muted">🚇 {a.access}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TREATMENT_GUIDES[locale].slice(0, 4).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/${locale}/${g.slug}/${a.slug}`}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 인기 게시물 */}
      {topPosts.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">{ui.secTopPosts}</h2>
            <span className="text-[11.5px] text-muted">{ui.topPostsHint}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {topPosts.map((p) => (
              <ConsumerPostCard key={p.id} locale={locale} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      <GimpoBlock locale={locale} />

      <ConsumerFaq items={ui.faq} title={ui.secFaq} />
    </div>
  );
}

// ---------- 시술 가이드 (전 지역) ----------

export async function ConsumerTreatmentPage({
  locale,
  g,
}: {
  locale: ConsumerLocale;
  g: TreatmentGuide;
}) {
  const ui = CONSUMER_UI[locale];
  const data = await loadConsumerData(locale);
  const posts = dailyRotation(filterPosts(data.posts, g.key), { take: 8, freshSlots: 2 });
  const promos = dailyRotation(filterPosts(data.ads, g.key), { pool: 8, take: 4, freshSlots: 1 });
  const stats = statsFor(data, g.key);
  const clinics = (await clinicsFor(locale, data.posts, undefined, g.key)).slice(0, 12);

  return (
    <div className="space-y-10">
      <FaqJsonLd items={ui.faq} />
      <BreadcrumbJsonLd
        items={[
          { name: ui.breadcrumbRoot, url: `${BASE}/${locale}` },
          { name: g.name, url: `${BASE}/${locale}/${g.slug}` },
        ]}
      />

      {/* 브레드크럼 + 타이틀 */}
      <section className="space-y-3">
        <nav className="text-[11.5px] text-muted">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {ui.breadcrumbRoot}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="font-bold text-foreground">{g.name}</span>
        </nav>
        <h1 className="text-[24px] font-black leading-tight tracking-tight text-foreground sm:text-[30px]">
          {ui.titleTreatmentPre}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {g.name}
          </span>
          {ui.titleTreatmentPost}
        </h1>
        <p className="max-w-3xl text-[14.5px] leading-relaxed text-muted">{g.desc}</p>
        {stats.postCount > 0 ? (
          <p className="text-[12px] font-bold text-primary-ink">
            {ui.statLine(stats.clinicCount, stats.postCount)}
          </p>
        ) : null}
      </section>

      <InfoCards locale={locale} g={g} />

      {/* 지역별 하위 페이지 */}
      <section className="space-y-3">
        <h2 className="text-[18px] font-black text-foreground">{ui.secByArea}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {AREA_GUIDES[locale].map((a) => {
            const n = filterPosts(data.posts, g.key, a.key).length;
            return (
              <Link
                key={a.slug}
                href={`/${locale}/${g.slug}/${a.slug}`}
                className="group rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
              >
                <p className="text-[15px] font-black text-foreground group-hover:text-primary-ink">
                  {ui.areaTreatmentLink(a.name, g.name)}
                </p>
                <p className="mt-1 text-[11.5px] text-muted">
                  {a.sub} · {ui.recentPosts(n)} →
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 인기 게시물 */}
      {posts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">{ui.postsOf(g.name)}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {posts.slice(0, 8).map((p) => (
              <ConsumerPostCard key={p.id} locale={locale} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 진행 중 프로모션 */}
      {promos.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">{ui.secPromos}</h2>
            <span className="text-[11.5px] text-muted">{ui.promosHint}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {promos.map((a) => (
              <ConsumerPromoCard key={a.id} locale={locale} ad={a} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 클리닉 목록 */}
      {clinics.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">
            {ui.clinicsPosting(g.name)}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clinics.map((c) => (
              <ConsumerClinicCard key={c.handle} locale={locale} clinic={c} />
            ))}
          </div>
        </section>
      ) : null}

      <GimpoBanner locale={locale} page="treatment" treatment={g.slug} />

      <ConsumerFaq items={ui.faq} title={ui.secFaq} />

      {/* 다른 시술 링크 (내부 링크 강화) */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-black text-foreground">{ui.otherTreatments}</h2>
        <div className="flex flex-wrap gap-1.5">
          {TREATMENT_GUIDES[locale]
            .filter((t) => t.slug !== g.slug)
            .map((t) => (
              <Link
                key={t.slug}
                href={`/${locale}/${t.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
              >
                {t.name}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

// ---------- 시술 × 지역 ----------

export async function ConsumerTreatmentAreaPage({
  locale,
  g,
  a,
}: {
  locale: ConsumerLocale;
  g: TreatmentGuide;
  a: AreaGuide;
}) {
  const ui = CONSUMER_UI[locale];
  const data = await loadConsumerData(locale);
  const posts = dailyRotation(filterPosts(data.posts, g.key, a.key), { take: 8, freshSlots: 2 });
  const promos = dailyRotation(filterPosts(data.ads, g.key, a.key), { pool: 8, take: 4, freshSlots: 1 });
  const stats = statsFor(data, g.key, a.key);
  const clinics = (await clinicsFor(locale, data.posts, a.key, g.key)).slice(0, 12);

  return (
    <div className="space-y-10">
      <FaqJsonLd items={ui.faq} />
      <BreadcrumbJsonLd
        items={[
          { name: ui.breadcrumbRoot, url: `${BASE}/${locale}` },
          { name: g.name, url: `${BASE}/${locale}/${g.slug}` },
          { name: a.name, url: `${BASE}/${locale}/${g.slug}/${a.slug}` },
        ]}
      />

      <section className="space-y-3">
        <nav className="text-[11.5px] text-muted">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {ui.breadcrumbRoot}
          </Link>
          <span className="mx-1.5">›</span>
          <Link href={`/${locale}/${g.slug}`} className="hover:text-foreground">
            {g.name}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="font-bold text-foreground">{a.name}</span>
        </nav>
        <h1 className="text-[24px] font-black leading-tight tracking-tight text-foreground sm:text-[30px]">
          {a.name}
          {locale === "jp" ? `(${a.sub})で` : " "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {g.name}
          </span>
        </h1>
        <p className="max-w-3xl text-[14.5px] leading-relaxed text-muted">
          {a.desc} {g.desc}
        </p>
        <p className="text-[11.5px] text-muted">🚇 {a.access}</p>
        {stats.postCount > 0 ? (
          <p className="text-[12px] font-bold text-primary-ink">
            {ui.statLineArea(stats.postCount, g.name)}
          </p>
        ) : null}
      </section>

      <InfoCards locale={locale} g={g} />

      {/* 클리닉 목록 — 지역 페이지에선 게시물보다 먼저 (전환 우선) */}
      {clinics.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">
            {ui.clinicsOfArea(a.name)}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clinics.map((c) => (
              <ConsumerClinicCard key={c.handle} locale={locale} clinic={c} />
            ))}
          </div>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">
            {ui.postsOfArea(a.name, g.name)}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {posts.slice(0, 8).map((p) => (
              <ConsumerPostCard key={p.id} locale={locale} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      {promos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">{ui.secPromos}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {promos.map((ad) => (
              <ConsumerPromoCard key={ad.id} locale={locale} ad={ad} />
            ))}
          </div>
        </section>
      ) : null}

      <GimpoBanner locale={locale} page="combo" treatment={g.slug} />

      <ConsumerFaq items={ui.faq} title={ui.secFaq} />

      {/* 내부 링크: 같은 시술 다른 지역 / 같은 지역 다른 시술 */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-[14px] font-black text-foreground">
            {ui.otherAreasFor(g.name)}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {AREA_GUIDES[locale]
              .filter((x) => x.slug !== a.slug)
              .map((x) => (
                <Link
                  key={x.slug}
                  href={`/${locale}/${g.slug}/${x.slug}`}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
                >
                  {x.name}
                </Link>
              ))}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-[14px] font-black text-foreground">
            {ui.otherTreatmentsIn(a.name)}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {TREATMENT_GUIDES[locale]
              .filter((x) => x.slug !== g.slug)
              .map((x) => (
                <Link
                  key={x.slug}
                  href={`/${locale}/${x.slug}/${a.slug}`}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
                >
                  {x.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
