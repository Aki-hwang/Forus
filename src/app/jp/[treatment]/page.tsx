// /jp/[treatment] — 시술 가이드 (전 지역). 일본어 검색 SEO의 허브 페이지.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadConsumerData,
  guideBySlug,
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

type Params = { treatment: string };

export function generateStaticParams(): Params[] {
  return TREATMENT_GUIDES.map((g) => ({ treatment: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { treatment } = await params;
  const g = guideBySlug(treatment);
  if (!g) return {};
  return {
    title: `韓国で${g.ja} — エリア別クリニックガイド`,
    description: `韓国旅行で${g.ja}(${g.jaAlt})を受けるなら。江南・明洞・弘大の日本語対応クリニックと、実際のInstagram人気投稿をデータで紹介。所要時間・ダウンタイムの目安も解説します。`,
    alternates: { canonical: `/jp/${g.slug}` },
  };
}

export default async function TreatmentPage({ params }: { params: Promise<Params> }) {
  const { treatment } = await params;
  const g = guideBySlug(treatment);
  if (!g) notFound();

  const data = await loadConsumerData();
  const posts = filterPosts(data.posts, g.key);
  const promos = filterPosts(data.ads, g.key).slice(0, 4);
  const stats = statsFor(data, g.key);
  const clinics = (await clinicsFor(data.posts, undefined, g.key)).slice(0, 12);

  return (
    <div className="space-y-10">
      <FaqJsonLd items={COMMON_FAQ} />
      <BreadcrumbJsonLd
        items={[
          { name: "韓国皮膚科ガイド", url: "https://www.dermaradar.kr/jp" },
          { name: g.ja, url: `https://www.dermaradar.kr/jp/${g.slug}` },
        ]}
      />

      {/* 브레드크럼 + 타이틀 */}
      <section className="space-y-3">
        <nav className="text-[11.5px] text-muted">
          <Link href="/jp" className="hover:text-foreground">
            韓国皮膚科ガイド
          </Link>
          <span className="mx-1.5">›</span>
          <span className="font-bold text-foreground">{g.ja}</span>
        </nav>
        <h1 className="text-[24px] font-black leading-tight tracking-tight text-foreground sm:text-[30px]">
          韓国で
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {g.ja}
          </span>
          を受けるなら
        </h1>
        <p className="max-w-3xl text-[13.5px] leading-relaxed text-muted">{g.desc}</p>
        {stats.postCount > 0 ? (
          <p className="text-[12px] font-bold text-primary-ink">
            直近90日、{stats.clinicCount}クリニック・{stats.postCount}件の日本語投稿を収集中
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

      {/* 지역별 하위 페이지 */}
      <section className="space-y-3">
        <h2 className="text-[18px] font-black text-foreground">エリア別に見る</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {AREA_GUIDES.map((a) => {
            const n = filterPosts(data.posts, g.key, a.key).length;
            return (
              <Link
                key={a.slug}
                href={`/jp/${g.slug}/${a.slug}`}
                className="group rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
              >
                <p className="text-[15px] font-black text-foreground group-hover:text-primary-ink">
                  {a.ja}で{g.ja}
                </p>
                <p className="mt-1 text-[11.5px] text-muted">
                  {a.kana}エリア · 投稿{n}件 →
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 인기 게시물 */}
      {posts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">
            {g.ja}の人気投稿
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {posts.slice(0, 8).map((p) => (
              <JpPostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 진행 중 프로모션 */}
      {promos.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">開催中のキャンペーン</h2>
            <span className="text-[11.5px] text-muted">長く配信されている広告ほど定番</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {promos.map((a) => (
              <JpPromoCard key={a.id} ad={a} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 클리닉 목록 */}
      {clinics.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black text-foreground">
            {g.ja}を発信しているクリニック
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clinics.map((c) => (
              <JpClinicCard key={c.handle} clinic={c} />
            ))}
          </div>
        </section>
      ) : null}

      <JpFaq items={COMMON_FAQ} />

      {/* 다른 시술 링크 (내부 링크 강화) */}
      <section className="space-y-3">
        <h2 className="text-[15px] font-black text-foreground">ほかの施術も見る</h2>
        <div className="flex flex-wrap gap-1.5">
          {TREATMENT_GUIDES.filter((t) => t.slug !== g.slug).map((t) => (
            <Link
              key={t.slug}
              href={`/jp/${t.slug}`}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
            >
              {t.ja}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
