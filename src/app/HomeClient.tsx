"use client";

// 대시보드 본체(클라이언트) — 데이터는 서버(page.tsx)가 스냅샷을 직접 읽어 props 로 내려준다.
// 예전엔 마운트 후 /api/ads·/api/organic 을 fetch 해 "데이터 불러오는 중" 빈 화면이 길게 떴는데,
// SSR 초기 데이터로 첫 페인트부터 카드가 있다(스피너 제거). 필터·정렬·모달 등 인터랙션만 담당.

import { useEffect, useMemo, useRef, useState } from "react";
import { Ad, Area, Lang, summarizeTrends } from "@/lib/ads";
import { Header } from "@/components/Header";
import { TrendPanel } from "@/components/TrendPanel";
import { FilterBar, type SortKey, type AdvKey } from "@/components/FilterBar";
import { AdminRequests } from "@/components/AdminRequests";
import { AdminInquiries } from "@/components/AdminInquiries";
import { AdminCollect } from "@/components/AdminCollect";
import { useUiLang } from "@/lib/i18n";
import { AdminGate } from "@/components/AdminGate";
import { RegisterClinic } from "@/components/RegisterClinic";
import { InquiryButton } from "@/components/InquiryButton";
import { gaEvent } from "@/lib/ga";
import { AdCard } from "@/components/AdCard";
import { AdDetailModal } from "@/components/AdDetailModal";
import { dayNumber, dailyJitter, DAILY_QUALITY_WEIGHT } from "@/lib/dailyOrder";

export type Source = "sample" | "apify";

export function HomeClient({
  initialAds,
  initialSource,
  initialOrganic,
  initialCollectedAt,
  nowMs,
}: {
  initialAds: Ad[];
  initialSource: Source;
  initialOrganic: Ad[];
  initialCollectedAt: string | null;
  /** 서버 렌더 시각 — 날짜 의존 정렬(최근7일·일별셔플)을 서버·클라이언트가 같은 값으로
   *  계산해 하이드레이션 불일치를 막는다. */
  nowMs: number;
}) {
  const [area, setArea] = useState<Area | "전체">("전체");
  const [lang, setLang] = useState<Lang | "전체">("전체");
  const [sort, setSort] = useState<SortKey>("trending");
  const [adv, setAdv] = useState<AdvKey>("전체");
  const [selected, setSelected] = useState<Ad | null>(null);
  // 카드/게시물 상세 열기 + GA 클릭 이벤트(인기 클릭 추적)
  const openAd = (ad: Ad) => {
    setSelected(ad);
    gaEvent("card_click", {
      clinic: ad.clinic.replace(/\s*\(.*\)$/, ""),
      area: ad.area,
      kind: ad.kind === "organic" ? "무료" : "유료",
    });
  };

  // SSR 초기 데이터로 시작 — 차단/제외(관리 모드) 즉시 반영을 위해 state 로 보관
  const [allAds, setAllAds] = useState<Ad[]>(initialAds);
  const [source] = useState<Source>(initialSource);
  const [organicAds, setOrganicAds] = useState<Ad[]>(initialOrganic);
  const collectedAt = initialCollectedAt;
  // 관리 모드: URL ?key= 가 있으면 카드에 "제외" 버튼 표시 (저장본 편집용)
  const [manageKey, setManageKey] = useState<string | null>(null);
  // 카드 점진 렌더 — 900+ 카드를 한 번에 그리면 DOM·이미지 요청 폭주로 로딩이 느려진다.
  // 처음 PAGE_SIZE 개만 그리고, 목록 끝 센티널이 보이면 자동으로 더 그린다.
  const PAGE_SIZE = 60;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const moreRef = useRef<HTMLDivElement | null>(null);

  // ?key= 감지 → 관리 모드 활성화
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("key");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (k) setManageKey(k);
  }, []);

  // 차단: 계정 자체를 영구 차단 (화면에서 즉시 제거 + 서버 차단목록 기록 → 재수집해도 안 보임)
  const blockAccount = async (ad: Ad) => {
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

  // 제외: 이 게시물만 현재 스냅샷에서 제거 (다음 수집 때 다시 보임)
  const excludeAd = async (ad: Ad) => {
    if (!manageKey) return;
    setAllAds((prev) => prev.filter((a) => a.id !== ad.id));
    setOrganicAds((prev) => prev.filter((a) => a.id !== ad.id));
    try {
      await fetch(`/api/exclude?key=${encodeURIComponent(manageKey)}&id=${encodeURIComponent(ad.id)}`);
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

  // 키워드 언어탭용 — 광고주 유형만 반영, 언어는 미필터(키워드 카드가 자체 탭으로 분리)
  const advPool = useMemo(
    () => merged.filter((a) => adv === "전체" || (a.advertiserType ?? "clinic") === adv),
    [merged, adv]
  );

  const base = useMemo(
    () =>
      merged.filter(
        (a) =>
          (lang === "전체" || a.lang === lang) &&
          (adv === "전체" || (a.advertiserType ?? "clinic") === adv)
      ),
    [merged, lang, adv]
  );

  const filtered = useMemo(() => {
    const list = base.filter((a) => area === "전체" || a.area === area);
    // 조회수순 — 조회수 없으면(유료 광고) 팔로워 수를 대용으로 써서 오가닉과 섞이게 한다.
    const reach = (a: Ad) => a.views ?? a.likes ?? 0;
    const byViews = (a: Ad, b: Ad) => reach(b) - reach(a);
    // 썸네일 유무 — 일부 광고는 Meta가 크리에이티브 이미지를 안 줘 색배경 폴백으로 뜬다.
    // 인기 정렬에서 같은 최근그룹이면 이미지 있는 카드를 먼저 보여 첫 화면이 비주얼로 차게 한다.
    const hasImg = (a: Ad) => Boolean(a.imageUrl);
    // 인기(trending): 최근 7일(달력일 기준) 게시물 우선 → 이미지 우선 → 그 안에서 "일별 셔플".
    // 날짜 기준은 서버가 내려준 nowMs — 서버·클라이언트 동일 값으로 하이드레이션 불일치 방지.
    const todayStart = new Date(nowMs);
    todayStart.setHours(0, 0, 0, 0);
    const cutoff = todayStart.getTime() - 7 * 86_400_000;
    const isRecent = (a: Ad) => {
      const ts = new Date((a.date ?? "").replace(" ", "T")).getTime();
      return !Number.isNaN(ts) && ts >= cutoff;
    };
    // 일별 셔플 점수: 조회수 순위(quality) + 그날 지터를 blend. 인기 카드는 위에 남되
    // 배치가 매일 회전한다. 하루 안에선 결정적(새로고침 안정), 자정마다 시드 변경.
    const day = dayNumber(new Date(nowMs));
    const qRank = new Map<string, number>();
    [...list].sort((a, b) => reach(b) - reach(a)).forEach((a, i) => qRank.set(a.id, i));
    const n = list.length || 1;
    const dailyScore = (a: Ad) =>
      (qRank.get(a.id) ?? 0) * DAILY_QUALITY_WEIGHT +
      dailyJitter(a.id, day) * n * (1 - DAILY_QUALITY_WEIGHT); // 낮을수록 앞
    const cmp: Record<SortKey, (a: Ad, b: Ad) => number> = {
      trending: (a, b) => {
        const ra = isRecent(a);
        const rb = isRecent(b);
        if (ra !== rb) return ra ? -1 : 1;
        // 같은 최근그룹: 이미지 있는 카드 우선(색배경 폴백을 뒤로) → 그다음 일별 셔플 점수
        const ia = hasImg(a);
        const ib = hasImg(b);
        if (ia !== ib) return ia ? -1 : 1;
        return dailyScore(a) - dailyScore(b);
      },
      views: byViews,
      followers: (a, b) => b.likes - a.likes,
      recent: (a, b) => b.date.localeCompare(a.date),
      activeDays: (a, b) => (b.activeDays ?? 0) - (a.activeDays ?? 0),
    };
    return [...list].sort(cmp[sort]);
  }, [base, area, sort, nowMs]);

  // 트렌드(지역별 분포 등)는 지역 필터와 무관하게 전체(언어 기준) 고정 집계.
  // 아래 지역 탭은 갤러리 그리드에만 적용됨.
  const trends = useMemo(() => summarizeTrends(base), [base]);

  // 필터·정렬이 바뀌면 첫 페이지부터 다시 (스크롤 위치 기준 재계산 방지)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE);
  }, [area, lang, adv, sort]);

  // 목록 끝 센티널이 화면에 들어오면 다음 페이지 렌더 (무한 스크롤)
  useEffect(() => {
    const el = moreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => (c < filtered.length ? c + PAGE_SIZE : c));
        }
      },
      { rootMargin: "600px" } // 끝에 닿기 전에 미리 로드
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, visibleCount]);

  // 로고 클릭 시 첫 화면 상태로 복귀 (맨 위 스크롤 + 필터/선택 초기화)
  const resetView = () => {
    // 로고 클릭 = 새로고침 (스냅샷 재요청, 필터 초기화)
    window.location.reload();
  };

  // 배지 상태: 실시간(apify) / 폴백(미연결)
  const live = source === "apify" || organicAds.length > 0;
  const { t } = useUiLang();

  return (
    <div className="min-h-full">
      <Header onReset={resetView} />

      <main className="mx-auto max-w-7xl px-5 pb-6 pt-4">
        {/* 헤더: 타이틀·상태(좌) + 타겟 언어 탭(우) 한 줄 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="pl-2 text-left">
            <h1 className="text-[19px] font-black leading-tight tracking-tight text-foreground sm:text-[25px]">
              {t("titlePre")}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t("titleHi")}
              </span>
            </h1>
            {manageKey ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  live ? "bg-primary/10 text-primary-ink" : "bg-border/60 text-muted"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-primary" : "bg-muted"}`} />
                {live ? "수집 데이터 (유료 + 무료)" : "샘플 데이터 (아직 수집 전)"}
              </span>
            </div>
            ) : null}
          </div>

          <div className="flex max-w-full overflow-x-auto rounded-xl border border-border bg-surface p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {([
              ["전체", "", "all"],
              ["KR", "🇰🇷", "langKo"],
              ["JP", "🇯🇵", "langJa"],
              ["CN", "🇨🇳", "langZh"],
              ["EN", "🇬🇧", "langEn"],
            ] as [Lang | "전체", string, "all" | "langKo" | "langJa" | "langZh" | "langEn"][]).map(([key, flag, tk]) => (
              <button
                key={key}
                onClick={() => setLang(key)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${
                  lang === key
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {flag ? `${flag} ` : ""}
                {t(tk)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {manageKey ? <AdminCollect adminKey={manageKey} /> : null}
          {manageKey ? <AdminRequests adminKey={manageKey} /> : null}
          {manageKey ? <AdminInquiries adminKey={manageKey} /> : null}
          <TrendPanel
            trends={trends}
            ads={base}
            keywordAds={advPool}
            onSelectAd={openAd}
            collectedAt={collectedAt}
            nowMs={nowMs}
          />

          <FilterBar
            area={area}
            onArea={setArea}
            sort={sort}
            onSort={setSort}
            adv={adv}
            onAdv={setAdv}
            resultCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface py-16 text-center text-muted">
              조건에 맞는 광고가 없어요. 필터를 바꿔보세요.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.slice(0, visibleCount).map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    onSelect={openAd}
                    onExclude={manageKey ? excludeAd : undefined}
                    onBlock={manageKey ? blockAccount : undefined}
                  />
                ))}
              </div>
              {visibleCount < filtered.length ? (
                <div ref={moreRef} className="py-6 text-center text-[12px] text-muted">
                  {visibleCount}/{filtered.length} — 스크롤하면 더 보여요
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>

      {/* 하단 고정 바 — 헤더(sticky top-0)처럼 스크롤해도 항상 보인다. 슬림하게 유지해
          화면을 조금만 차지. 등록·문의 CTA 를 어디서든 바로 누를 수 있게. */}
      {/* 불투명 배경 유지 — backdrop-blur(backdrop-filter)는 자식 position:fixed 의 기준을
          뷰포트→footer 로 바꿔, 안에 있는 등록·문의·관리자 모달이 화면 구석에 갇히는 버그를 낸다. */}
      <footer className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3 text-[11px] text-muted">
            <span className="hidden truncate sm:inline">© Doctorstock Inc. All Rights Reserved</span>
            <AdminGate manageKey={manageKey} onSet={setManageKey} />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RegisterClinic />
            <InquiryButton />
          </div>
        </div>
      </footer>

      {selected ? (
        <AdDetailModal ad={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
