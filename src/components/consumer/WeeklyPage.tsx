// 주간 레이더 리포트 — /{locale}/weekly(최신) · /{locale}/weekly/{주차}(아카이브) 공용 본체.
// 집계는 lib/weekly.ts 가 스냅샷에서 즉석 계산 — 크론·저장 없음, 수집이 끝나면 자동 갱신.

import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConsumerLocale,
  CONSUMER_UI,
  loadConsumerData,
  guideByKey,
  altLanguages,
} from "@/lib/consumer";
import { resolveWeekly, WEEK_MS } from "@/lib/weekly";
import { ConsumerPostCard, ConsumerPromoCard } from "./ConsumerCards";
import { BreadcrumbJsonLd } from "./ConsumerFaq";
import { GimpoBanner } from "./ConsumerPages";

const BASE = "https://www.dermaradar.kr";

// generateMetadata 와 페이지 본문이 같은 요청 안에서 데이터·주차 판정을 공유한다.
// 따로 계산하면 두 호출 사이에 자정(주 전환)·수집 완료가 끼었을 때 메타데이터와
// 본문이 서로 다른 주차를 가리키는 불일치가 난다 (+ 파이프라인 2회 실행 낭비).
const weeklyContext = cache(async (locale: ConsumerLocale, week?: string) => {
  const data = await loadConsumerData(locale);
  return resolveWeekly(data, week);
});

/** 옵셔널 캐치올 파라미터 검증 — 세그먼트 2개 이상은 없는 경로 */
function weekParamOf(weekParam?: string[]): string | undefined {
  if (weekParam && weekParam.length > 1) notFound();
  return weekParam?.[0];
}

function weekLabelOf(locale: ConsumerLocale, id: string): string {
  const [, m, d] = id.split("-").map(Number);
  return CONSUMER_UI[locale].weekly.weekLabel(m, d);
}

/** 라우트 generateMetadata 용 — 주차 검증 포함.
 *  잘못된 주차는 notFound() 로 (스트리밍 메타데이터라 브라우저 상태코드는 200 으로
 *  남지만, 잘못된 canonical/hreflang 생성을 막고 검색엔진에는 noindex 가 전달된다) */
export async function weeklyMetadataChecked(
  locale: ConsumerLocale,
  weekParam?: string[]
): Promise<Metadata> {
  const week = weekParamOf(weekParam);
  const w = CONSUMER_UI[locale].weekly;
  let latestDated = false;
  if (week) {
    const resolved = await weeklyContext(locale, week);
    if (!resolved) notFound();
    // 최신 주의 일자 URL 은 /weekly 와 같은 내용 — canonical 을 /weekly 로 돌려 중복 방지
    latestDated = resolved.weeks[0] === week;
  }
  const label = week ? weekLabelOf(locale, week) : w.navTitle;
  const sub = week && !latestDated ? `/weekly/${week}` : "/weekly";
  return {
    // 레이아웃 title.template(브랜드 문구 포함)와 결합하면 핵심 키워드가 중복되므로 absolute
    title: { absolute: `${w.metaTitle(label)} | DermaRadar` },
    description: w.metaDesc(label),
    alternates: {
      canonical: `/${locale}${sub}`,
      // 주차 존재 여부가 로케일(언어 버킷)마다 달라 아카이브 URL 의 hreflang 은
      // 404 를 가리킬 수 있다 — 항상 존재하는 /weekly 허브에만 hreflang 을 건다.
      ...(week ? {} : { languages: altLanguages("/weekly") }),
    },
  };
}

/** 증감 표기 — ▲ 증가 / ▼ 감소 / – 유지 */
function Delta({ delta }: { delta: number }) {
  if (delta > 0) return <span className="font-black text-emerald-600">▲{delta}</span>;
  if (delta < 0) return <span className="font-black text-rose-500">▼{-delta}</span>;
  return <span className="font-bold text-muted">–</span>;
}

export async function ConsumerWeeklyPage({
  locale,
  week: weekParam,
}: {
  locale: ConsumerLocale;
  week?: string[];
}) {
  const week = weekParamOf(weekParam);
  const ui = CONSUMER_UI[locale];
  const w = ui.weekly;
  const resolved = await weeklyContext(locale, week);
  if (!resolved) notFound();
  const { report, weeks } = resolved;
  // 최신 주는 /weekly(무일자) 를 대표 URL 로 쓴다
  const hrefFor = (id: string) =>
    id === weeks[0] ? `/${locale}/weekly` : `/${locale}/weekly/${id}`;
  const idx = weeks.indexOf(report.id);
  const newer = idx > 0 ? weeks[idx - 1] : null;
  const older = idx >= 0 && idx < weeks.length - 1 ? weeks[idx + 1] : null;
  const navCls =
    "rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-muted transition hover:text-foreground";
  const pageUrl = `${BASE}${hrefFor(report.id)}`;
  // 리포트 발행 시점 = 그 주가 끝난 월요일 (진행 중이면 주 시작일)
  const publishedMs = report.isCurrent ? report.startMs : report.startMs + WEEK_MS;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: w.metaTitle(weekLabelOf(locale, report.id)),
    datePublished: new Date(publishedMs).toISOString(),
    inLanguage: ui.htmlLang,
    mainEntityOfPage: pageUrl,
    author: { "@type": "Organization", name: "DermaRadar" },
  };

  return (
    <div className="space-y-10">
      <BreadcrumbJsonLd
        items={[
          { name: ui.breadcrumbRoot, url: `${BASE}/${locale}` },
          { name: w.title(weekLabelOf(locale, report.id)), url: pageUrl },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      {/* 헤더 */}
      <section className="pt-2 sm:pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[24px] font-black tracking-tight text-foreground sm:text-[30px]">
            {w.title(weekLabelOf(locale, report.id))}
          </h1>
          {report.isCurrent ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary-ink">
              {w.currentBadge}
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-3xl break-keep text-[14px] leading-relaxed text-muted">
          {w.intro}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-[12.5px] font-bold text-primary-ink">
            {w.statLine(report.postCount, report.adCount, report.accountCount)}
          </p>
          <span className="ml-auto flex gap-1.5">
            {older ? (
              <Link href={hrefFor(older)} className={navCls}>
                ← {weekLabelOf(locale, older)}
              </Link>
            ) : null}
            {newer ? (
              <Link href={hrefFor(newer)} className={navCls}>
                {weekLabelOf(locale, newer)} →
              </Link>
            ) : null}
          </span>
        </div>
      </section>

      {report.postCount === 0 && report.adCount === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center text-[14px] text-muted">
          {w.noData}
        </section>
      ) : null}

      {/* 시술 동향 — 지난주 대비 */}
      {report.treatments.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">{w.secTrending}</h2>
            <span className="text-[11.5px] text-muted">{w.trendingHint}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {report.treatments.map((r) => {
              const g = guideByKey(locale, r.key);
              return (
                <Link
                  key={r.key}
                  href={`/${locale}/${g.slug}`}
                  className="group flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-black text-foreground group-hover:text-primary-ink">
                      {g.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {r.count}
                      <span className="mx-1 text-border">|</span>
                      <span className="text-[11px]">{r.prev}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px]">
                    <Delta delta={r.delta} />
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 이번 주 시작한 이벤트 */}
      {report.newAds.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">{w.secNewAds}</h2>
            <span className="text-[11.5px] text-muted">{w.newAdsHint}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.newAds.map((ad) => (
              <ConsumerPromoCard key={ad.id} locale={locale} ad={ad} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 주간 인기 게시물 */}
      {report.topPosts.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">{w.secTopPosts}</h2>
            <span className="text-[11.5px] text-muted">{w.topPostsHint}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {report.topPosts.map((p) => (
              <ConsumerPostCard key={p.id} locale={locale} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 장수 진행 이벤트 — 최신 주 전용 */}
      {report.longRunners.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">{w.secLongRunners}</h2>
            <span className="text-[11.5px] text-muted">{w.longRunnersHint}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {report.longRunners.map((ad) => (
              <ConsumerPromoCard key={ad.id} locale={locale} ad={ad} />
            ))}
          </div>
        </section>
      ) : null}

      <GimpoBanner locale={locale} page="weekly" />

      {/* 아카이브 — 왼쪽부터 오래된 순 (시간이 왼→오로 흐르는 자연스러운 읽기 방향) */}
      {weeks.length > 1 ? (
        <section className="space-y-3">
          <h2 className="text-[16px] font-black text-foreground">{w.archive}</h2>
          <div className="flex flex-wrap gap-1.5">
            {[...weeks].reverse().map((id) =>
              id === report.id ? (
                <span
                  key={id}
                  className="rounded-full bg-foreground px-3 py-1.5 text-[12px] font-bold text-white"
                >
                  {weekLabelOf(locale, id)}
                </span>
              ) : (
                <Link key={id} href={hrefFor(id)} className={navCls}>
                  {weekLabelOf(locale, id)}
                </Link>
              )
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
