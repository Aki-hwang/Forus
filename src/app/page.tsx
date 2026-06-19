"use client";

import { useEffect, useMemo, useState } from "react";
import { Ad, Area, Lang, summarizeTrends } from "@/lib/ads";
import { sampleAds } from "@/lib/sampleAds";
import { Header } from "@/components/Header";
import { TrendPanel } from "@/components/TrendPanel";
import { FilterBar, type SortKey } from "@/components/FilterBar";
import { AdCard } from "@/components/AdCard";
import { AdDetailModal } from "@/components/AdDetailModal";

type Source = "sample" | "apify";

export default function Home() {
  const [area, setArea] = useState<Area | "전체">("전체");
  const [lang, setLang] = useState<Lang | "전체">("전체");
  const [sort, setSort] = useState<SortKey>("views");
  const [selected, setSelected] = useState<Ad | null>(null);

  // 수집 스냅샷(샘플)으로 먼저 그리고, 마운트 후 /api/ads 로 실시간 수집분으로 교체
  const [allAds, setAllAds] = useState<Ad[]>(sampleAds);
  const [source, setSource] = useState<Source>("sample");
  // 2단계: 조회수 보강 상태 (loading → 진행중, done → 반영됨)
  const [viewState, setViewState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    let alive = true;
    // 1단계: 빠르게 광고 목록 (팔로워순)
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data: { source?: Source; ads?: Ad[] }) => {
        if (!alive || !data?.ads?.length) return;
        setAllAds(data.ads);
        setSource(data.source ?? "sample");

        // 2단계: 조회수 보강 (느림 → 끝나면 재정렬)
        if (data.source === "apify") {
          setViewState("loading");
          fetch("/api/ads/views")
            .then((r) => r.json())
            .then((v: { ads?: Ad[] }) => {
              if (!alive || !v?.ads?.length) return;
              setAllAds(v.ads);
              setViewState("done");
            })
            .catch(() => alive && setViewState("idle"));
        }
      })
      .catch(() => {
        /* 네트워크 실패 시 목업 유지 */
      });
    return () => {
      alive = false;
    };
  }, []);

  // 타겟 언어(JP/CN) → 지역 필터 → 조회수 우선 정렬
  const base = useMemo(
    () => allAds.filter((a) => lang === "전체" || a.lang === lang),
    [allAds, lang]
  );

  const filtered = useMemo(() => {
    const list = base.filter((a) => area === "전체" || a.area === area);
    const byViews = (a: Ad, b: Ad) => {
      const av = a.views,
        bv = b.views;
      if (av != null && bv != null) return bv - av;
      if (av != null) return -1;
      if (bv != null) return 1;
      return b.likes - a.likes;
    };
    const cmp: Record<SortKey, (a: Ad, b: Ad) => number> = {
      views: byViews,
      followers: (a, b) => b.likes - a.likes,
      recent: (a, b) => b.date.localeCompare(a.date),
      activeDays: (a, b) => (b.activeDays ?? 0) - (a.activeDays ?? 0),
    };
    return [...list].sort(cmp[sort]);
  }, [base, area, sort]);

  // 트렌드(지역별 분포 등)는 지역 필터와 무관하게 전체(언어 기준) 고정 집계.
  // 아래 지역 탭은 갤러리 그리드에만 적용됨.
  const trends = useMemo(() => summarizeTrends(base), [base]);

  return (
    <div className="min-h-full">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-6">
        {/* 헤더: 타이틀·상태(좌) + 타겟 언어 탭(우) 한 줄 */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-left">
            <h1 className="text-[17px] font-black leading-tight tracking-tight text-foreground sm:text-[21px]">
              일본/중국인 관광객 대상 피부과 광고를
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}
                한눈에
              </span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  source === "apify" ? "bg-primary/10 text-primary-ink" : "bg-border/60 text-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    source === "apify" ? "bg-primary" : "bg-muted"
                  }`}
                />
                {source === "apify" ? "실시간 수집 (Meta 광고 라이브러리)" : "수집 데이터 (개발용 · Apify 미연결)"}
              </span>
              {viewState === "loading" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-border/60 px-2.5 py-0.5 text-[11px] font-bold text-muted">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted/40 border-t-muted" />
                  조회수 불러오는 중…
                </span>
              ) : null}
              {viewState === "done" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary-ink">
                  ▶ 조회수 반영됨
                </span>
              ) : null}
            </div>
          </div>

          <div className="inline-flex rounded-xl border border-border bg-surface p-1">
            {([
              ["전체", "전체"],
              ["KR", "🇰🇷 한국인 타겟"],
              ["JP", "🇯🇵 일본인 타겟"],
              ["CN", "🇨🇳 중국인 타겟"],
            ] as [Lang | "전체", string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLang(key)}
                className={`rounded-lg px-4 py-2 text-[13.5px] font-bold transition ${
                  lang === key
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <TrendPanel trends={trends} ads={base} onSelectAd={setSelected} />

          <FilterBar
            area={area}
            onArea={setArea}
            sort={sort}
            onSort={setSort}
            resultCount={filtered.length}
          />

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
        {source === "apify" ? "실시간 수집" : "수집 데이터(개발용)"}
      </footer>

      {selected ? (
        <AdDetailModal ad={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
