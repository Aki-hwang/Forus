// /jp/[treatment]/[area] — 시술×지역 가이드. "明洞 水光注射" 류 일본어 검색의 랜딩.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadConsumerData,
  guideBySlug,
  areaBySlug,
  filterPosts,
  statsFor,
  clinicsFor,
  AREA_GUIDES,
  TREATMENT_GUIDES,
  COMMON_FAQ,
} from "@/lib/consumer";
import { JpPostCard, JpPromoCard, JpClinicCard } from "@/components/consumer/JpCards";
import { JpFaq, FaqJsonLd, BreadcrumbJsonLd } from "@/components/consumer/JpFaq";

export const dynamic = "force-dynamic";

type Params = { treatment: string; area: string };

export function generateStaticParams(): Params[] {
  return TREATMENT_GUIDES.flatMap((g) =>
    AREA_GUIDES.map((a) => ({ treatment: g.slug, area: a.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { treatment, area } = await params;
  const g = guideBySlug(treatment);
  const a = areaBySlug(area);
  if (!g || !a) return {};
  return {
    title: `${a.ja}(${a.kana})で${g.ja} — 日本語対応クリニックと人気投稿`,
    description: `${a.ja}エリアで${g.ja}(${g.jaAlt})を受けたい方へ。日本語対応クリニックのInstagramと、実際の人気投稿をデータで紹介。アクセス・所要時間・ダウンタイムの目安も解説します。`,
    alternates: { canonical: `/jp/${g.slug}/${a.slug}` },
  };
}

export default async function TreatmentAreaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { treatment, area } = await params;
  const g = guideBySlug(treatment);
  const a = areaBySlug(area);
  if (!g || !a) notFound();

  const data = await loadConsumerData();
  const posts = filterPosts(data.posts, g.key, a.key);
  const promos = filterPosts(data.ads, g.key, a.key).slice(0, 4);
  const stats = statsFor(data, g.key, a.key);
  const clinics = (await clinicsFor(data.posts, a.key, g.key)).slice(0, 12);

  return (
    <div className="space-y-10">
      <FaqJsonLd items={COMMON_FAQ} />
      <BreadcrumbJsonLd
        items={[
          { name: "韓国皮膚科ガイド", url: "https://www.dermaradar.kr/jp" },
          { name: g.ja, url: `https://www.dermaradar.kr/jp/${g.slug}` },
          { name: a.ja, url: `https://www.dermaradar.kr/jp/${g.slug}/${a.slug}` },
        ]}
      />

      <section className="space-y-3">
        <nav className="text-[11.5px] text-muted">
          <Link href="/jp" className="hover:text-foreground">
            韓国皮膚科ガイド
          </Link>
          <span className="mx-1.5">›</span>
          <Link href={`/jp/${g.slug}`} className="hover:text-foreground">
            {g.ja}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="font-bold text-foreground">{a.ja}</span>
        </nav>
        <h1 className="text-[24px] font-black leading-tight tracking-tight text-foreground sm:text-[30px]">
          {a.ja}({a.kana})で
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {g.ja}
          </span>
        </h1>
        <p className="max-w-3xl text-[13.5px] leading-relaxed text-muted">
          {a.desc} {g.desc}
        </p>
        <p className="text-[11.5px] text-muted">🚇 {a.access}</p>
        {stats.postCount > 0 ? (
          <p className="text-[12px] font-bold text-primary-ink">
            直近90日、このエリアで{stats.postCount}件の{g.ja}関連の日本語投稿を収集中
          </p>
        ) : null}
      </section>

      {/* 시술 기본 정보 */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["⏱ 所要時間の目安", g.time],
          ["🩹 ダウンタイム", g.downtime],
          ["✈️ 旅行者向けメモ", g.travelTip],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11.5px] font-black text-muted">{label}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{value}</p>
          </div>
        ))}
      </section>

      {/* 클리닉 목록 — 지역 페이지에선 게시물보다 먼저 (예약 전환 우선) */}
      {clinics.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">
            {a.ja}のクリニック
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clinics.map((c) => (
              <JpClinicCard key={c.handle} clinic={c} />
            ))}
          </div>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">
            {a.ja}の{g.ja}人気投稿
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {posts.slice(0, 8).map((p) => (
              <JpPostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      {promos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">開催中のキャンペーン</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {promos.map((ad) => (
              <JpPromoCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      ) : null}

      <JpFaq items={COMMON_FAQ} />

      {/* 내부 링크: 같은 시술 다른 지역 / 같은 지역 다른 시술 */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-[14px] font-black text-foreground">ほかのエリアで{g.ja}</h2>
          <div className="flex flex-wrap gap-1.5">
            {AREA_GUIDES.filter((x) => x.slug !== a.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/jp/${g.slug}/${x.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
              >
                {x.ja}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-[14px] font-black text-foreground">{a.ja}でほかの施術</h2>
          <div className="flex flex-wrap gap-1.5">
            {TREATMENT_GUIDES.filter((x) => x.slug !== g.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/jp/${x.slug}/${a.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
              >
                {x.ja}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
