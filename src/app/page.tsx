"use client";

import { useEffect, useMemo, useState } from "react";
import { Ad, Area, Lang, summarizeTrends } from "@/lib/ads";
import { Header } from "@/components/Header";
import { TrendPanel } from "@/components/TrendPanel";
import { FilterBar, type SortKey, type KindKey } from "@/components/FilterBar";
import { AdCard } from "@/components/AdCard";
import { AdDetailModal } from "@/components/AdDetailModal";

type Source = "sample" | "apify";

export default function Home() {
  const [area, setArea] = useState<Area | "전체">("전체");
  const [lang, setLang] = useState<Lang | "전체">("전체");
  const [sort, setSort] = useState<SortKey>("recent");
  const [kind, setKind] = useState<KindKey>("전체");
  const [selected, setSelected] = useState<Ad | null>(null);

  // 수집 스냅샷(샘플)으로 먼저 그리고, 마운트 후 /api/ads 로 실시간 수집분으로 교체
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [source, setSource] = useState<Source>("sample");
  // 오가닉(IG 자연 게시물) — 광고와 별개로 받아 합친다
  const [organicAds, setOrganicAds] = useState<Ad[]>([]);
  // 관리 모드: URL ?key= 가 있으면 카드에 "제외" 버튼 표시 (저장본 편집용)
  const [manageKey, setManageKey] = useState<string | null>(null);
  // 2단계: 조회수 보강 상태 (loading → 진행중, done → 반영됨)
  const [viewState, setViewState] = useState<"idle" | "loading" | "done">("idle");
  // 1단계 수집 진행중 여부 (true → /api/ads 응답 대기, 최대 2~4분). 끝나면 source 로 판별.
  const [collecting, setCollecting] = useState(true);

  useEffect(() => {
    let alive = true;
    // 1단계: 빠르게 광고 목록 (팔로워순)
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data: { source?: Source; ads?: Ad[] }) => {
        if (!alive) return;
        setCollecting(false); // 응답 도착 → 수집 진행중 종료 (성공/폴백 모두)
        if (!data?.ads?.length) return;
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
        if (alive) setCollecting(false);
      });

    // 오가닉(IG 자연 게시물) 수집 — 광고와 독립적으로 받아 합친다
    fetch("/api/organic")
      .then((r) => r.json())
      .then((data: { ads?: Ad[] }) => {
        if (alive && data?.ads?.length) setOrganicAds(data.ads);
      })
      .catch(() => {
        /* 오가닉 실패는 무시(광고만 표시) */
      });
    return () => {
      alive = false;
    };
  }, []);

  // ?key= 감지 → 관리 모드 활성화
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("key");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (k) setManageKey(k);
  }, []);

  // 저장본에서 계정 제외 (화면에서 즉시 제거 + 서버 차단목록에 기록)
  const removeAd = async (ad: Ad) => {
    if (!manageKey) return;
    const handle = ad.igUsername?.toLowerCase();
    const name = ad.clinic?.toLowerCase();
    const match = (a: Ad) =>
      Boolean(handle && a.igUsername?.toLowerCase() === handle) ||
      Boolean(!handle && name && a.clinic?.toLowerCase() === name);
    setAllAds((prev) => prev.filter((a) => !match(a)));
    setOrganicAds((prev) => prev.filter((a) => !match(a)));
    const entry = ad.igUsername || ad.clinic;
    try {
      await fetch(`/api/block?key=${encodeURIComponent(manageKey)}&handle=${encodeURIComponent(entry)}`);
    } catch {
      /* 무시 */
    }
  };

  // 타겟 언어(JP/CN) → 지역 필터 → 조회수 우선 정렬
  // 광고 + 오가닉 병합 (id 중복 제거)
  const merged = useMemo(() => {
    const seen = new Set(allAds.map((a) => a.id));
    const all = [...allAds, ...organicAds.filter((a) => !seen.has(a.id))];
    // 기존 데이터엔 EN 분류가 없으므로, 한자·한글·가나 없고 라틴문자 우세하면 영어로 재분류
    const isEN = (a: Ad) => {
      const t = `${a.headline ?? ""} ${a.caption ?? ""}`;
      if (/[぀-ヿ가-힣㐀-鿿]/.test(t)) return false;
      return (t.match(/[A-Za-z]/g) || []).length >= 4;
    };
    return all.map((a) => (isEN(a) ? { ...a, lang: "EN" as Lang } : a));
  }, [allAds, organicAds]);

  // 첫 로드 중(아직 데이터 없음) → 81 깜빡임 대신 로딩 표시
  const loading = collecting && merged.length === 0;

  const base = useMemo(
    () =>
      merged.filter(
        (a) =>
          (lang === "전체" || a.lang === lang) &&
          (kind === "전체" || (a.kind ?? "ad") === kind)
      ),
    [merged, lang, kind]
  );

  const filtered = useMemo(() => {
    const list = base.filter((a) => area === "전체" || a.area === area);
    // 조회수순 — 조회수 없으면(유료 광고) 팔로워 수를 대용으로 써서 오가닉과 섞이게 한다.
    const reach = (a: Ad) => a.views ?? a.likes ?? 0;
    const byViews = (a: Ad, b: Ad) => reach(b) - reach(a);
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

  // 로고 클릭 시 첫 화면 상태로 복귀 (맨 위 스크롤 + 필터/선택 초기화)
  const resetView = () => {
    setArea("전체");
    setLang("전체");
    setKind("전체");
    setSort("recent");
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 배지 상태: 실시간(apify) / 수집 진행중(collecting) / 폴백(미연결)
  const live = source === "apify" || organicAds.length > 0;
  const isCollecting = collecting && !live;

  return (
    <div className="min-h-full">
      <Header onReset={resetView} />

      <main className="mx-auto max-w-7xl px-5 py-6">
        {/* 헤더: 타이틀·상태(좌) + 타겟 언어 탭(우) 한 줄 */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-left">
            <h1 className="text-[17px] font-black leading-tight tracking-tight text-foreground sm:text-[21px]">
              강남·명동·홍대 피부과 마케팅 트렌드를
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}
                한눈에
              </span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  live || isCollecting ? "bg-primary/10 text-primary-ink" : "bg-border/60 text-muted"
                }`}
              >
                {isCollecting ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                ) : (
                  <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-primary" : "bg-muted"}`} />
                )}
                {live
                  ? "수집 데이터 (유료 + 무료)"
                  : isCollecting
                  ? "데이터 불러오는 중…"
                  : "샘플 데이터 (아직 수집 전)"}
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
              ["KR", "🇰🇷 한국어"],
              ["JP", "🇯🇵 일본어"],
              ["CN", "🇨🇳 중국어"],
              ["EN", "🇬🇧 영어"],
            ] as [Lang | "전체", string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLang(key)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-bold transition ${
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

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="text-[13px] font-bold">데이터 불러오는 중…</span>
          </div>
        ) : (
          <div className="space-y-6">
          <TrendPanel trends={trends} ads={base} onSelectAd={setSelected} />

          <FilterBar
            area={area}
            onArea={setArea}
            sort={sort}
            onSort={setSort}
            kind={kind}
            onKind={setKind}
            resultCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface py-16 text-center text-muted">
              조건에 맞는 광고가 없어요. 필터를 바꿔보세요.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onSelect={setSelected}
                  onRemove={manageKey ? removeAd : undefined}
                />
              ))}
            </div>
          )}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-[12px] text-muted">
        DermaRadar · 피부과 광고 트렌드 · Doctorstock Developed by 황철진
      </footer>

      {selected ? (
        <AdDetailModal ad={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
