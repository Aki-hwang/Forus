"use client";

import { useMemo, useState } from "react";
import { Ad, TrendSummary } from "@/lib/ads";
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
  const clinicAds = useMemo(() => ads.filter(isLikelyClinic), [ads]);
  // 최다 조회 광고 — 클리닉만 기준 (클릭 시 모달)
  const topAd = useMemo(() => {
    const v = clinicAds.filter((a) => typeof a.views === "number");
    if (v.length) return [...v].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
    return [...clinicAds].sort((a, b) => b.likes - a.likes)[0] ?? null;
  }, [clinicAds]);

  // TOP 클리닉: 기간(집행 시작일 기준) 선택 → 광고주 단위 조회수(없으면 팔로워) 랭킹
  const [period, setPeriod] = useState<number>(30);
  const [now] = useState(() => Date.now());
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
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 좌측: 핵심 지표 */}
      <div className="grid grid-cols-2 gap-3 lg:col-span-5">
        <Stat label="수집된 광고" value={`${trends.total}건`} hint="강남·명동·홍대" />
        <Stat label="▶ 평균 조회수" value={fmt(trends.avgViews)} hint="IG 릴스 조회수 중앙값" />
        <Stat
          label="🔥 최다 조회 광고"
          value={topAd?.views != null ? fmt(topAd.views) : "-"}
          hint={cleanClinic(topAd?.clinic)}
          onClick={topAd && onSelectAd ? () => onSelectAd(topAd) : undefined}
        />
        <Stat
          label="🏥 광고 중 클리닉"
          value={`${trends.advertiserCount}곳`}
          hint="중복 제외 광고주 수"
        />
      </div>

      {/* 우측: 조회수 TOP 클리닉 + 지역별 분포 */}
      <div className="rounded-2xl border border-border bg-surface p-4 lg:col-span-7">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="shrink-0 whitespace-nowrap text-[13px] font-bold text-foreground">
                조회수 TOP 클리닉
              </p>
              <div className="flex items-center gap-1">
                <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5">
                  {[7, 30].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
                        period === p ? "bg-surface text-primary-ink shadow-sm" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {`${p}일`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    placeholder="직접"
                    value={![7, 30].includes(period) ? period : ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setPeriod(Number.isFinite(v) && v > 0 ? v : 30);
                    }}
                    className={`w-12 rounded-md bg-transparent px-2 py-0.5 text-center text-[11px] font-bold outline-none transition placeholder:font-normal placeholder:text-muted ${
                      ![7, 30].includes(period) ? "bg-surface text-primary-ink shadow-sm" : "text-muted"
                    }`}
                  />
                </div>
                <span className="text-[11px] text-muted">일</span>
              </div>
            </div>
            <div className="space-y-1 max-w-[380px]">
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
                    <span className="w-3.5 shrink-0 text-center text-[12px] font-black text-muted">{i + 1}</span>
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

          <div className="sm:col-span-2">
            <p className="mb-3 text-[13px] font-bold text-foreground">지역별 광고 분포</p>
            <div className="space-y-2.5">
              {trends.byArea.map((a) => (
                <Bar key={a.area} label={a.area} count={a.count} max={maxArea} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
