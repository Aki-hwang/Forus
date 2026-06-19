import { TrendSummary } from "@/lib/ads";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
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

export function TrendPanel({ trends }: { trends: TrendSummary }) {
  const maxTreatment = trends.byTreatment[0]?.count ?? 1;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 좌측: 핵심 지표 */}
      <div className="grid grid-cols-2 gap-3 lg:col-span-5">
        <Stat label="수집된 광고" value={`${trends.total}건`} hint="강남·명동·홍대" />
        {trends.live ? (
          <Stat
            label="평균 팔로워"
            value={trends.avgFollowers.toLocaleString()}
            hint="광고주 IG 팔로워"
          />
        ) : (
          <Stat
            label="평균 인게이지먼트"
            value={trends.avgEngagement.toLocaleString()}
            hint="좋아요+저장 평균"
          />
        )}
        <Stat
          label="가장 핫한 시술"
          value={trends.byTreatment[0]?.label ?? "-"}
          hint={`${trends.byTreatment[0]?.count ?? 0}건 집행`}
        />
        {trends.live ? (
          <Stat
            label="⏳ 최장 집행 광고"
            value={trends.longestRunning ? `${trends.longestRunning.activeDays ?? 0}일` : "-"}
            hint={trends.longestRunning?.clinic.replace(/\s*\(.*\)$/, "") ?? ""}
          />
        ) : (
          <Stat
            label="🔥 최고 반응 광고"
            value={trends.hottest ? `${(trends.hottest.likes / 1000).toFixed(1)}k` : "-"}
            hint={trends.hottest?.clinic.replace(/\s*\(.*\)$/, "") ?? ""}
          />
        )}
      </div>

      {/* 우측: 시술별 분포 + 태그 트렌드 */}
      <div className="rounded-2xl border border-border bg-surface p-4 lg:col-span-7">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-[13px] font-bold text-foreground">시술별 광고 분포</p>
            <div className="space-y-2.5">
              {trends.byTreatment.slice(0, 5).map((t) => (
                <Bar key={t.key} label={t.label} count={t.count} max={maxTreatment} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[13px] font-bold text-foreground">지금 뜨는 키워드</p>
            <div className="flex flex-wrap gap-2">
              {trends.topTags.map((t, i) => (
                <span
                  key={t.tag}
                  className="rounded-full border border-border px-2.5 py-1 text-[12px] font-medium"
                  style={{
                    background:
                      i < 3 ? "rgba(14,165,164,0.10)" : "var(--background)",
                    color: i < 3 ? "var(--primary-ink)" : "var(--muted)",
                    fontWeight: i < 3 ? 700 : 500,
                  }}
                >
                  #{t.tag}
                  <span className="ml-1 opacity-60">{t.count}</span>
                </span>
              ))}
            </div>

            <p className="mb-2 mt-4 text-[13px] font-bold text-foreground">인기 컬러 무드</p>
            <div className="flex gap-1.5">
              {trends.topPalettes.map((p, i) => (
                <div
                  key={i}
                  className="h-7 flex-1 rounded-md"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${p[0]}, ${p[1]})`,
                  }}
                  title={`${p[0]} → ${p[1]}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
