"use client";

import { useMemo, useState } from "react";
import { Ad, TreatmentKey, TREATMENT_LABEL, TrendSummary } from "@/lib/ads";
import { classifyTreatment } from "@/lib/treatments";
import { hasClinicSignal } from "@/lib/clinics";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

function Stat({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p> : null}
    </>
  );
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
      >
        {inner}
      </button>
    );
  }
  return <div className="rounded-2xl border border-border bg-surface p-4">{inner}</div>;
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-[12px] font-medium text-foreground">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          style={{ width: `${Math.max(pct, 6)}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-[12px] font-bold text-muted">{count}</span>
    </div>
  );
}

export function TrendPanel({
  trends,
  ads,
  onSelectAd,
}: {
  trends: TrendSummary;
  ads: Ad[];
  onSelectAd?: (ad: Ad) => void;
}) {
  const maxArea = Math.max(1, ...trends.byArea.map((a) => a.count));
  const cleanClinic = (s?: string) => (s ?? "").replace(/\s*\(.*\)$/, "");
  // 병원으로 보이는 광고주만 (등록 클리닉 또는 계정명/핸들에 병원 신호) → 인플루언서·블로그 제외
  const isLikelyClinic = (a: Ad) =>
    a.featured || hasClinicSignal(a.clinic) || hasClinicSignal(a.igUsername);
  const [now] = useState(() => Date.now());
  const clinicAds = useMemo(() => ads.filter(isLikelyClinic), [ads]);
  // 최다 조회 광고 — 클리닉만 기준 (클릭 시 모달)
  const topAd = useMemo(() => {
    const v = clinicAds.filter((a) => typeof a.views === "number");
    if (v.length) return [...v].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
    return [...clinicAds].sort((a, b) => b.likes - a.likes)[0] ?? null;
  }, [clinicAds]);
  // 신규 광고 — 최근 7일 내 시작
  const newAds7 = useMemo(
    () =>
      ads.filter((a) => {
        const t = new Date((a.date ?? "").replace(" ", "T")).getTime();
        return !Number.isNaN(t) && now - t <= 7 * 86_400_000;
      }).length,
    [ads, now]
  );
  // 인기 시술 — 캡션 키워드로 재분류, 안 잡히면 제외(물광 기본값 쏠림 방지)
  const topTreatments = useMemo(() => {
    const m = new Map<TreatmentKey, number>();
    for (const a of ads) {
      const t = classifyTreatment(`${a.headline ?? ""} ${a.caption ?? ""}`);
      if (t) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, label: TREATMENT_LABEL[key].ko, count }));
  }, [ads]);
  const maxTreatment = Math.max(1, ...topTreatments.map((t) => t.count));
  const topKeywords = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of ads) for (const h of a.hashtags ?? []) {
      const k = h.trim();
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tag]) => tag);
  }, [ads]);

  // TOP 클리닉: 기간(집행 시작일 기준) 선택 → 광고주 단위 조회수(없으면 팔로워) 랭킹
  const period = 30;
  const ranked = useMemo(() => {
    const inRange = ads.filter((a) => {
      const t = new Date((a.date ?? "").replace(" ", "T")).getTime();
      return !Number.isNaN(t) && now - t <= period * 86_400_000 && isLikelyClinic(a);
    });
    const m = new Map<
      string,
      { clinic: string; area: string; igUsername?: string; views?: number; followers: number }
    >();
    for (const a of inRange) {
      const key = a.igUsername ?? a.clinic;
      const cur = m.get(key);
      if (!cur) {
        m.set(key, { clinic: a.clinic, area: a.area, igUsername: a.igUsername, views: a.views, followers: a.likes });
      } else {
        if ((a.views ?? -1) > (cur.views ?? -1)) cur.views = a.views;
        cur.followers = Math.max(cur.followers, a.likes);
      }
    }
    return [...m.values()].sort((x, y) => (y.views ?? -1) - (x.views ?? -1) || y.followers - x.followers);
  }, [ads, period, now]);
  return (
    <div className="space-y-4">
      {/* 상단: 핵심 지표 · 지역별 분포 · 인기 키워드 */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="grid grid-cols-3 gap-3 lg:col-span-5">
          <Stat label="수집된 광고" value={`${trends.total}건`} hint="강남·명동·홍대" />
          <Stat label="🆕 신규 광고" value={`${newAds7}건`} hint="최근 7일 시작" />
          <Stat
            label="🔥 최다 조회 광고"
            value={topAd?.views != null ? fmt(topAd.views) : "-"}
            hint={cleanClinic(topAd?.clinic)}
            onClick={topAd && onSelectAd ? () => onSelectAd(topAd) : undefined}
          />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 lg:col-span-4">
          <p className="mb-3 text-[13px] font-bold text-foreground">지역별 광고 분포</p>
          <div className="space-y-2.5">
            {trends.byArea.map((a) => (
              <Bar key={a.area} label={a.area} count={a.count} max={maxArea} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 lg:col-span-3">
          <p className="mb-2 text-[13px] font-bold text-foreground">인기 키워드</p>
          {topKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {topKeywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-primary-ink"
                >
                  {k}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted">키워드 없음</p>
          )}
        </div>
      </section>

      {/* 하단: 조회수 TOP 클리닉 · 인기 시술 */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-border bg-surface p-4 lg:col-span-7">
          <p className="mb-3 text-[13px] font-bold text-foreground">조회수 TOP 클리닉</p>
          <div className="space-y-1 max-w-[320px]">
            {ranked.length === 0 ? (
              <p className="py-3 text-[12px] text-muted">이 기간에 집행된 광고가 없어요.</p>
            ) : null}
            {ranked.slice(0, 5).map((c, i) => {
              const href = c.igUsername
                ? `https://www.instagram.com/${c.igUsername}/`
                : undefined;
              const rowClass =
                "flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition hover:bg-background";
              const name = c.clinic.replace(/\s*\(.*\)$/, "");
              const shortName = name.length > 15 ? name.slice(0, 15) + "…" : name;
              const inner = (
                <>
                  <span className="w-3.5 shrink-0 text-center text-[12px] font-black text-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-foreground">
                    {shortName}
                    <span className="ml-1 text-[11px] font-medium text-muted">· {c.area}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-bold text-primary-ink">
                    {c.views != null ? `▶ ${fmt(c.views)}` : "▶ -"}
                  </span>
                </>
              );
              return href ? (
                <a
                  key={c.clinic + i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={rowClass}
                >
                  {inner}
                </a>
              ) : (
                <div key={c.clinic + i} className={rowClass}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 lg:col-span-5">
          <p className="mb-3 text-[13px] font-bold text-foreground">인기 시술</p>
          <div className="space-y-2">
            {topTreatments.length === 0 ? (
              <p className="text-[12px] text-muted">분류된 시술이 없어요.</p>
            ) : null}
            {topTreatments.map((t) => {
              const pct = Math.max(8, Math.round((t.count / maxTreatment) * 100));
              return (
                <div key={t.key} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 truncate text-[12px] font-medium text-foreground">
                    {t.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[12px] font-bold text-muted">
                    {t.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
