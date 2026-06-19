import { Ad, TrendSummary } from "@/lib/ads";

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
        <span className="mt-1 block text-[10px] font-bold text-primary-ink">클릭해서 광고 보기 →</span>
      </button>
    );
  }
  return <div className="rounded-2xl border border-border bg-surface p-4">{inner}</div>;
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[12px] font-medium text-foreground">{label}</span>
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
  onSelectAd,
}: {
  trends: TrendSummary;
  onSelectAd?: (ad: Ad) => void;
}) {
  const maxArea = Math.max(1, ...trends.byArea.map((a) => a.count));
  const cleanClinic = (s?: string) => (s ?? "").replace(/\s*\(.*\)$/, "");
  // 최다 조회(없으면 최다 반응) 광고 — 클릭 시 모달
  const topAd = trends.mostViewed ?? trends.hottest;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 좌측: 핵심 지표 */}
      <div className="grid grid-cols-2 gap-3 lg:col-span-5">
        <Stat label="수집된 광고" value={`${trends.total}건`} hint="강남·명동·홍대" />
        {trends.hasViews ? (
          <Stat label="▶ 평균 조회수" value={fmt(trends.avgViews)} hint="IG 릴스 조회수 중앙값" />
        ) : trends.live ? (
          <Stat label="평균 팔로워" value={fmt(trends.avgFollowers)} hint="광고주 IG 팔로워" />
        ) : (
          <Stat
            label="평균 인게이지먼트"
            value={trends.avgEngagement.toLocaleString()}
            hint="좋아요+저장 평균"
          />
        )}
        {trends.hasViews ? (
          <Stat
            label="🔥 최다 조회 광고"
            value={trends.mostViewed?.views != null ? fmt(trends.mostViewed.views) : "-"}
            hint={cleanClinic(trends.mostViewed?.clinic)}
            onClick={topAd && onSelectAd ? () => onSelectAd(topAd) : undefined}
          />
        ) : trends.live ? (
          <Stat
            label="👥 최다 팔로워"
            value={trends.hottest ? fmt(trends.hottest.likes) : "-"}
            hint={cleanClinic(trends.hottest?.clinic)}
            onClick={topAd && onSelectAd ? () => onSelectAd(topAd) : undefined}
          />
        ) : (
          <Stat
            label="🔥 최고 반응 광고"
            value={trends.hottest ? `${(trends.hottest.likes / 1000).toFixed(1)}k` : "-"}
            hint={cleanClinic(trends.hottest?.clinic)}
            onClick={topAd && onSelectAd ? () => onSelectAd(topAd) : undefined}
          />
        )}
        <Stat
          label="🏥 광고 중 클리닉"
          value={`${trends.advertiserCount}곳`}
          hint="중복 제외 광고주 수"
        />
      </div>

      {/* 우측: 조회수 TOP 클리닉 + 지역별 분포 */}
      <div className="rounded-2xl border border-border bg-surface p-4 lg:col-span-7">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-[13px] font-bold text-foreground">
              {trends.hasViews ? "조회수 TOP 클리닉" : "팔로워 TOP 클리닉"}
            </p>
            <div className="space-y-1">
              {trends.topAdvertisers.slice(0, 5).map((c, i) => {
                const href = c.igUsername
                  ? `https://www.instagram.com/${c.igUsername}/`
                  : undefined;
                const rowClass =
                  "flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:bg-background";
                const inner = (
                  <>
                    <span className="w-4 shrink-0 text-[12px] font-black text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-foreground">
                      {c.clinic.replace(/\s*\(.*\)$/, "")}
                      <span className="ml-1 text-[11px] font-medium text-muted">· {c.area}</span>
                    </span>
                    <span className="shrink-0 text-[12px] font-bold text-primary-ink">
                      {c.views != null ? `▶ ${fmt(c.views)}` : `👥 ${fmt(c.followers)}`}
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

          <div>
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
