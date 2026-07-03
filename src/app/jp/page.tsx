// /jp — 일본인 여행자용 랜딩. 수집 스냅샷 기반 SSR (Apify 호출 없음).

import type { Metadata } from "next";
import Link from "next/link";
import {
  loadConsumerData,
  treatmentCounts,
  TREATMENT_GUIDES,
  AREA_GUIDES,
  COMMON_FAQ,
} from "@/lib/consumer";
import { JpPostCard } from "@/components/consumer/JpCards";
import { JpFaq, FaqJsonLd } from "@/components/consumer/JpFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "韓国皮膚科ガイド — 人気施術とクリニックをデータで探す",
  description:
    "韓国旅行で皮膚科に行くなら。江南・明洞・弘大のクリニックの実際のInstagram投稿データから、水光注射・リフティング・ボトックスなど人気施術と日本語対応クリニックを探せます。",
  alternates: { canonical: "/jp" },
};

export default async function JpHome() {
  const data = await loadConsumerData();
  const counts = treatmentCounts(data);
  const topPosts = data.posts.slice(0, 8);

  return (
    <div className="space-y-10">
      <FaqJsonLd items={COMMON_FAQ} />

      {/* 히어로 */}
      <section className="pt-2 text-center sm:pt-6">
        <h1 className="text-[26px] font-black leading-tight tracking-tight text-foreground sm:text-[34px]">
          韓国の皮膚科を、
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            データで選ぶ
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted sm:text-[14.5px]">
          江南・明洞・弘大のクリニックが実際に発信しているInstagram投稿を毎週収集。
          広告ではなく<strong className="text-foreground">「いま本当に人気の施術・クリニック」</strong>
          がわかる、日本人旅行者のための韓国皮膚科ガイドです。
        </p>
      </section>

      {/* 시술에서 찾기 */}
      <section id="treatments" className="space-y-3 scroll-mt-20">
        <h2 className="text-[18px] font-black text-foreground">施術から探す</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TREATMENT_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/jp/${g.slug}`}
              className="group rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
            >
              <p className="text-[15px] font-black text-foreground group-hover:text-primary-ink">
                {g.ja}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted">{g.jaAlt}</p>
              <p className="mt-2 text-[11.5px] font-bold text-primary-ink">
                直近の投稿 {counts.get(g.key) ?? 0}件 →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 지역에서 찾기 */}
      <section id="areas" className="space-y-3 scroll-mt-20">
        <h2 className="text-[18px] font-black text-foreground">エリアから探す</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {AREA_GUIDES.map((a) => (
            <div key={a.slug} className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-[16px] font-black text-foreground">
                {a.ja} <span className="text-[12px] font-bold text-muted">({a.kana})</span>
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{a.desc}</p>
              <p className="mt-1.5 text-[11.5px] text-muted">🚇 {a.access}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {TREATMENT_GUIDES.slice(0, 4).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/jp/${g.slug}/${a.slug}`}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-foreground/70 transition hover:border-primary hover:text-primary-ink"
                  >
                    {g.ja}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 이번 주 인기 게시물 */}
      {topPosts.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-black text-foreground">いま人気の投稿</h2>
            <span className="text-[11.5px] text-muted">
              実際のInstagram投稿(タップで原文へ)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {topPosts.map((p) => (
              <JpPostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 김포공항 에어리어 특집 */}
      <section className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-accent/5 p-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-primary-ink">
          Airport Area Pick
        </p>
        <h2 className="mt-1 text-[17px] font-black text-foreground">
          金浦空港エリアという選択肢 — YOU&amp;I 金浦店
        </h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">
          羽田—金浦便を使うなら、金浦空港側のクリニックも便利です。ソウル中心部の混雑を避けて、
          フライト前後の時間を活用できます。皮膚科ネットワーク「YOU&amp;I(ユーアンドアイ)」の金浦店は
          日本語Instagramアカウントで相談を受け付けています。
        </p>
        <a
          href="https://www.instagram.com/youandi_gimpo_jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition hover:opacity-90"
        >
          @youandi_gimpo_jp で相談する →
        </a>
      </section>

      <JpFaq items={COMMON_FAQ} />
    </div>
  );
}
