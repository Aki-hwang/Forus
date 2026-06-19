"use client";

import { useMemo, useState } from "react";
import { ads, Ad, Area, TreatmentKey, summarizeTrends } from "@/lib/ads";
import { Header } from "@/components/Header";
import { TrendPanel } from "@/components/TrendPanel";
import { FilterBar } from "@/components/FilterBar";
import { AdCard } from "@/components/AdCard";
import { AdDetailModal } from "@/components/AdDetailModal";

export default function Home() {
  const [area, setArea] = useState<Area | "전체">("전체");
  const [treatment, setTreatment] = useState<TreatmentKey | "전체">("전체");
  const [selected, setSelected] = useState<Ad | null>(null);

  const filtered = useMemo(
    () =>
      ads.filter(
        (a) =>
          (area === "전체" || a.area === area) &&
          (treatment === "전체" || a.treatment === treatment)
      ),
    [area, treatment]
  );

  // 트렌드는 현재 지역 필터 기준으로 집계 (시술 필터는 무시해 전체 그림 유지)
  const trends = useMemo(
    () => summarizeTrends(ads.filter((a) => area === "전체" || a.area === area)),
    [area]
  );

  return (
    <div className="min-h-full">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-6">
        {/* Hero */}
        <section className="mb-6">
          <h1 className="text-[26px] font-black leading-tight tracking-tight text-foreground sm:text-[30px]">
            일본·중국 타겟 피부과 광고를
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}
              한눈에
            </span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
            강남·명동·홍대 피부과들이 지금 돌리는 인스타 광고를 모아 트렌드를 읽고,
            마음에 드는 광고를 클릭하면{" "}
            <b className="text-foreground">우리 광고를 자동으로 생성</b>해 드립니다.
          </p>
        </section>

        <div className="space-y-6">
          <TrendPanel trends={trends} />

          <FilterBar
            area={area}
            onArea={setArea}
            treatment={treatment}
            onTreatment={setTreatment}
            resultCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface py-16 text-center text-muted">
              조건에 맞는 광고가 없어요. 필터를 바꿔보세요.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((ad) => (
                <AdCard key={ad.id} ad={ad} onClick={setSelected} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-[12px] text-muted">
        Forus · 피부과 광고 트렌드 & AI 광고 생성 · MVP (목업 데이터)
      </footer>

      {selected ? (
        <AdDetailModal ad={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
