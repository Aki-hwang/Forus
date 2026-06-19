"use client";

import { useEffect, useMemo, useState } from "react";
import { ads as mockAds, Ad, Area, summarizeTrends } from "@/lib/ads";
import { Header } from "@/components/Header";
import { TrendPanel } from "@/components/TrendPanel";
import { FilterBar } from "@/components/FilterBar";
import { AdCard } from "@/components/AdCard";
import { AdDetailModal } from "@/components/AdDetailModal";

type Source = "mock" | "apify";

export default function Home() {
  const [area, setArea] = useState<Area | "전체">("전체");
  const [selected, setSelected] = useState<Ad | null>(null);

  // 목업으로 먼저 그리고, 마운트 후 /api/ads 로 실시간 수집분으로 교체 (실패 시 목업 유지)
  const [allAds, setAllAds] = useState<Ad[]>(mockAds);
  const [source, setSource] = useState<Source>("mock");

  useEffect(() => {
    let alive = true;
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data: { source?: Source; ads?: Ad[] }) => {
        if (!alive || !data?.ads?.length) return;
        setAllAds(data.ads);
        setSource(data.source ?? "mock");
      })
      .catch(() => {
        /* 네트워크 실패 시 목업 유지 */
      });
    return () => {
      alive = false;
    };
  }, []);

  // 지역 필터 + 인기(조회수→현재는 팔로워 프록시) 높은 순으로 정렬
  const filtered = useMemo(
    () =>
      allAds
        .filter((a) => area === "전체" || a.area === area)
        .sort((a, b) => b.likes - a.likes),
    [allAds, area]
  );

  // 트렌드는 현재 지역 필터 기준으로 집계
  const trends = useMemo(
    () => summarizeTrends(allAds.filter((a) => area === "전체" || a.area === area)),
    [allAds, area]
  );

  return (
    <div className="min-h-full">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-6">
        {/* Hero */}
        <section className="mb-6">
          <h1 className="text-[26px] font-black leading-tight tracking-tight text-foreground sm:text-[30px]">
            일본/중국인 관광객 대상 피부과 광고를
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}
              한눈에
            </span>
          </h1>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              source === "apify"
                ? "bg-primary/10 text-primary-ink"
                : "bg-border/60 text-muted"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                source === "apify" ? "bg-primary" : "bg-muted"
              }`}
            />
            {source === "apify"
              ? "실시간 수집 (Apify · Meta 광고 라이브러리)"
              : "목업 데이터 (Apify 토큰 미설정)"}
          </span>
        </section>

        <div className="space-y-6">
          <TrendPanel trends={trends} />

          <FilterBar area={area} onArea={setArea} resultCount={filtered.length} />

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface py-16 text-center text-muted">
              조건에 맞는 광고가 없어요. 필터를 바꿔보세요.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((ad) => (
                <AdCard key={ad.id} ad={ad} onGenerate={setSelected} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-[12px] text-muted">
        DermaRadar · 피부과 광고 트렌드 · MVP ·{" "}
        {source === "apify" ? "실시간 수집" : "목업 데이터"}
      </footer>

      {selected ? (
        <AdDetailModal ad={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
