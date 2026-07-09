"use client";

import { useMemo, useState } from "react";
import { Ad, Lang, TreatmentKey, TrendSummary } from "@/lib/ads";
import { classifyTreatment, displayHashtags } from "@/lib/treatments";
import { useUiLang } from "@/lib/i18n";
import { hasClinicSignal } from "@/lib/clinics";
import { onePerAccount, type AdLeaderRow } from "@/lib/trendingSort";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

// 해시태그의 글자(스크립트) 판별 — 게시물 언어가 아니라 태그 자체 기준
type Script = "JP" | "KR" | "HAN" | "EN" | null;
function tagScript(t: string): Script {
  if (/[぀-ヿ]/.test(t)) return "JP"; // 가나
  if (/[가-힣]/.test(t)) return "KR";
  if (/[㐀-鿿]/.test(t)) return "HAN"; // 한자(일본 한자/중국어 모호)
  if (/[A-Za-z]/.test(t)) return "EN";
  return null;
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
      {/* 라벨은 한 줄 고정 — "최다 조회(7일)"처럼 길어도 줄바꿈되지 않게 */}
      <p className="whitespace-nowrap text-center text-[11.5px] font-bold text-foreground sm:text-[12.5px]">{label}</p>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
        {hint ? <p className="mt-0.5 max-w-full truncate text-[11px] text-muted">{hint}</p> : null}
      </div>
    </>
  );
  // 좌우 패딩은 다른 패널(p-4)보다 좁게 — 카드가 작아 p-4 는 비율상 여백이 커 보인다
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex h-full flex-col rounded-2xl border border-border bg-surface px-2.5 py-4 text-left transition hover:border-primary/40 hover:shadow-sm"
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface px-2.5 py-4 text-left">
      {inner}
    </div>
  );
}

function Bar({ label, count, max, labelClass = "w-24" }: { label: string; count: number; max: number; labelClass?: string }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className={`${labelClass} shrink-0 truncate whitespace-nowrap text-[12px] font-medium text-foreground`}>{label}</span>
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

function classifyContentType(text: string): string {
  const t = text.toLowerCase();
  const has = (arr: string[]) => arr.some((k) => t.includes(k));
  // 이벤트·할인 (프로모/가격/오픈) — 한·영·일·중
  if (
    has([
      "이벤트", "할인", "특가", "프로모", "오픈", "혜택", "쿠폰", "선착순", "페이백",
      "한정", "특별가", "사은품", "증정", "무료", "%", "event", "sale", "off", "promo",
      "discount", "coupon", "limited",
      "割引", "キャンペーン", "特別価格", "特価", "セール", "限定", "オープン", "開院",
      "クーポン", "先着", "プレゼント", "無料", "期間限定", "特典",
      "优惠", "活动", "活動", "折扣", "特价", "特價", "开幕", "開幕", "优惠券", "優惠券",
      "免费", "免費", "限时", "限時", "限量", "特惠", "福利", "赠",
    ])
  )
    return "이벤트·할인";
  // 비포애프터
  if (
    has([
      "전후", "비포", "애프터", "변화", "결과", "before", "after",
      "術前", "術後", "ビフォー", "アフター", "変化", "ビフォーアフター",
      "前后", "前後", "对比", "對比",
    ])
  )
    return "비포애프터";
  // 후기·리뷰
  if (
    has([
      "후기", "리뷰", "재방문", "만족", "솔직", "review",
      "口コミ", "レビュー", "体験談", "感想", "体験",
      "评价", "評價", "评测", "評測", "心得", "真實", "體驗",
    ])
  )
    return "후기·리뷰";
  // 시술정보 (시술·효과·시술명) — 병원 식별어(피부과/클리닉)는 제외(거의 모든 글에 있어 과분류됨)
  if (
    has([
      "시술", "효과", "정보", "추천", "방법", "부작용", "다운타임", "회복", "원리",
      "관리", "꿀팁", "케어", "리프팅", "필러", "보톡스", "물광", "주사", "레이저",
      "볼륨", "탄력", "lifting", "filler", "botox",
      "施術", "治療", "効果", "リフト", "リフティング", "おすすめ", "ダウンタイム",
      "ケア", "肌管理", "ヒアルロン", "ボトックス", "糸リフト", "注射", "美肌", "小顔",
      "たるみ", "シミ", "毛穴", "水光", "ボリューム", "弾力",
      "治疗", "效果", "管理", "推荐", "推薦", "提升", "童颜", "童顏", "玻尿酸", "肉毒",
      "微整", "项目", "項目", "方案", "紧致", "緊緻", "嫩肤", "嫩膚", "毛孔", "抗老",
    ])
  )
    return "시술정보";
  return "브랜딩";
}

/** 순위 행 — TOP 클리닉·TOP 게시물·광고 집행 TOP 패널 공용 (링크/버튼/정적 3형) */
function RankRow({
  i,
  name,
  sub,
  right,
  href,
  oc,
  onClick,
}: {
  i: number;
  name: string;
  sub?: string;
  right: React.ReactNode;
  href?: string;
  oc?: string;
  onClick?: () => void;
}) {
  const cls =
    "flex w-full items-center gap-1.5 rounded-lg px-1.5 text-left transition hover:bg-background";
  const short = name.length > 15 ? name.slice(0, 15) + "…" : name;
  const inner = (
    <>
      <span className="w-3.5 shrink-0 text-center text-[12px] font-black text-muted">
        {i + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-foreground">
        {short}
        {sub ? <span className="ml-1 text-[11px] font-medium text-muted">· {sub}</span> : null}
      </span>
      <span className="shrink-0 whitespace-nowrap text-[12px] font-bold text-primary-ink">
        {right}
      </span>
    </>
  );
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" data-oc={oc} className={cls}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}

export function TrendPanel({
  trends,
  ads,
  overviewAds,
  keywordAds,
  leaderboard = [],
  dataPending = false,
  onSelectAd,
  collectedAt,
  nowMs,
  reviewMode = false,
}: {
  trends: TrendSummary;
  ads: Ad[];
  /** 상단 요약(신규 광고·최다 조회)용 — 병원/시술후기 탭 무시, 언어 탭만 반영된 전체 목록.
   *  요약 지표는 탭을 바꿔도 흔들리지 않는 '전체 현황판'으로 고정한다. */
  overviewAds?: Ad[];
  keywordAds: Ad[];
  /** 광고 집행 리더보드 — HomeClient 가 원본 전체 광고(allAds)에서 집계해 전달 */
  leaderboard?: AdLeaderRow[];
  /** 초기 슬라이스만 있는 상태 — 광고 기반 패널이 '없음'으로 깜빡이지 않게 로딩 표시 */
  dataPending?: boolean;
  onSelectAd?: (ad: Ad) => void;
  collectedAt?: string | null;
  /** 기준 시각(SSR) — 서버·클라이언트가 같은 값으로 7일 창을 계산해 하이드레이션 불일치 방지 */
  nowMs?: number;
  /** 시술후기 탭 여부 — true 면 병원 대신 후기 계정 기준으로 7일 지표를 집계 */
  reviewMode?: boolean;
}) {
  const { t: tt, tArea, tContentType, tTreatment, tClinic, lang } = useUiLang();
  const [kwLang, setKwLang] = useState<Lang | "전체">("전체");
  const [kwOpen, setKwOpen] = useState(false);
  // 모바일: 지표 패널 6개가 세로로 쌓여 갤러리가 2~3스크린 밀리던 문제 —
  // 핵심 지표 3칸만 기본 노출하고 나머지는 '더보기'로 접는다 (md 이상은 항상 펼침)
  const [trendOpen, setTrendOpen] = useState(false);
  const maxArea = Math.max(1, ...trends.byArea.map((a) => a.count));
  const collectedLabel = (() => {
    if (!collectedAt) return tt("hintRegions");
    const d = new Date(collectedAt);
    if (Number.isNaN(d.getTime())) return tt("hintRegions");
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day} ${tt("collectedSuffix")}`;
  })();
  // 7일 지표 대상 — 기본(전체/병원 탭): 병원으로 보이는 광고주만 (인플루언서·블로그가
  // 트렌드를 왜곡하지 않게). 시술후기 탭(reviewMode): 후기 계정 자체가 집계 대상 —
  // 이 분기가 없으면 시술후기 탭에서 4개 지표가 전부 0건이 된다.
  const isLikelyClinic = (a: Ad) =>
    reviewMode
      ? a.advertiserType === "influencer"
      : a.advertiserType !== "influencer" &&
        (a.featured || hasClinicSignal(a.clinic) || hasClinicSignal(a.igUsername));
  const [now] = useState(() => nowMs ?? Date.now());
  // 최근 7일(게시물 날짜/광고 시작일 기준) — 90일 누적 스냅샷 전체로 랭킹하면
  // 항상 같은 클리닉·게시물이 고정되므로, TOP 지표는 최신 7일만 본다.
  const within7d = (a: Ad) => {
    const t = new Date((a.date ?? "").replace(" ", "T")).getTime();
    return !Number.isNaN(t) && now - t <= 7 * 86_400_000;
  };
  const clinicAds = useMemo(
    () => ads.filter((a) => isLikelyClinic(a) && within7d(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ads, now, reviewMode]
  );
  // 상단 요약용 전체 목록 — overviewAds 미전달 시 ads 로 폴백(하위호환)
  const overview = overviewAds ?? ads;
  // 최다 조회(7일) — 상단 요약 카드: 탭 무관 전체 기준, 병원으로 보이는 광고주만
  // (전체 탭에서의 기존 산식 그대로 — 인플루언서 협찬 릴스가 지표를 왜곡하지 않게)
  const topAd = useMemo(() => {
    const pool = overview.filter(
      (a) =>
        within7d(a) &&
        a.advertiserType !== "influencer" &&
        (a.featured || hasClinicSignal(a.clinic) || hasClinicSignal(a.igUsername))
    );
    const v = pool.filter((a) => typeof a.views === "number");
    if (v.length) return [...v].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
    return [...pool].sort((a, b) => b.likes - a.likes)[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview, now]);
  // 조회수 TOP 게시물 — 최근 7일, 계정당 1건 (onePerAccount 주석 참고)
  const topPosts = useMemo(
    () =>
      onePerAccount(
        [...clinicAds].sort((a, b) => (b.views ?? b.likes) - (a.views ?? a.likes))
      ).slice(0, 5),
    [clinicAds]
  );
  // 신규 광고(7일 내 시작) — 상단 요약 카드: 탭 무관 전체 기준
  const newAds7 = useMemo(
    () =>
      overview.filter((a) => {
        const t = new Date((a.date ?? "").replace(" ", "T")).getTime();
        return !Number.isNaN(t) && now - t <= 7 * 86_400_000;
      }).length,
    [overview, now]
  );
  // 최근 7일 — 인기 시술·콘텐츠 유형 분포용. 기본은 병원만(협찬글 왜곡 방지),
  // 시술후기 탭에선 후기 글이 곧 대상.
  const ads7 = useMemo(
    () =>
      ads.filter(
        (a) =>
          within7d(a) &&
          (reviewMode ? a.advertiserType === "influencer" : a.advertiserType !== "influencer")
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ads, now, reviewMode]
  );
  // 인기 시술 — 최근 7일, 캡션 키워드로 재분류, 안 잡히면 제외(물광 기본값 쏠림 방지)
  const topTreatments = useMemo(() => {
    const m = new Map<TreatmentKey, number>();
    for (const a of ads7) {
      const t = classifyTreatment(`${a.headline ?? ""} ${a.caption ?? ""}`);
      if (t) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }));
  }, [ads7]);
  const maxTreatment = Math.max(1, ...topTreatments.map((t) => t.count));
  // 콘텐츠 유형 — 최근 7일 광고 스타일 분포
  const topStyles = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of ads7) {
      const t = classifyContentType(`${a.headline ?? ""} ${a.caption ?? ""}`);
      m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m.entries()]
      .filter(([, c]) => c > 0)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 5);
  }, [ads7]);
  const maxStyle = Math.max(1, ...topStyles.map(([, c]) => c));
  const kwCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of keywordAds) {
      // displayHashtags: 미분류 게시물에 주입된 파생 태그(#물광 등)를 집계에서 제외
      for (const h of displayHashtags(a)) {
        const k = h.trim();
        if (!k) continue;
        if (kwLang !== "전체") {
          const sc = tagScript(k);
          if (kwLang === "EN" && sc !== "EN") continue;
          if (kwLang === "KR" && sc !== "KR") continue;
          if (kwLang === "JP" && !(sc === "JP" || (sc === "HAN" && a.lang === "JP"))) continue;
          if (kwLang === "CN" && !(sc === "HAN" && a.lang !== "JP")) continue;
        }
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [keywordAds, kwLang]);
  const topKeywords = useMemo(() => kwCounts.slice(0, 20).map(([tag]) => tag), [kwCounts]);

  // TOP 클리닉: 최근 7일(집행 시작일 기준) → 광고주 단위 조회수(없으면 팔로워) 랭킹
  const period = 7;
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
    // isLikelyClinic 은 reviewMode 에만 의존하는 렌더 스코프 함수 — reviewMode 를 dep 로 대신 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ads, period, now, reviewMode]);
  return (
    <div className="space-y-4">
      {/* 상단: 핵심 지표 · 지역별 분포 · 인기 키워드 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* 지표 3칸이 좁아 라벨이 줄바꿈되던 문제 — 막대 위주라 폭이 남는 지역별 분포에서 1칸 가져옴(5:3:4) */}
        <div className="grid grid-cols-3 gap-3 md:col-span-5">
          <Stat label={tt("statCollected")} value={`${trends.total}${tt("unit")}`} hint={collectedLabel} />
          <Stat label={tt("statNew")} value={`${newAds7}${tt("unit")}`} hint={tt("hintNew7")} />
          <Stat
            label={tt("statTop")}
            value={topAd?.views != null ? fmt(topAd.views) : "-"}
            hint={tClinic(topAd?.clinic ?? "", topAd?.igUsername)}
            onClick={topAd && onSelectAd ? () => onSelectAd(topAd) : undefined}
          />
        </div>

        <div className={`${trendOpen ? "block" : "hidden"} rounded-2xl border border-border bg-surface p-4 md:block md:col-span-3`}>
          <p className="mb-3 text-center text-[13px] font-bold text-foreground">{tt("regionDist")}</p>
          <div className="space-y-2.5">
            {/* 라벨 폭: 영어(Myeongdong)만 넓게, CJK(강남·明洞)는 2자라 좁게 — 막대 길이 확보 */}
            {trends.byArea.map((a) => (
              <Bar key={a.area} label={tArea(a.area)} count={a.count} max={maxArea} labelClass={lang === "en" ? "w-24" : "w-8"} />
            ))}
          </div>
        </div>

        <div className={`${trendOpen ? "block" : "hidden"} rounded-2xl border border-border bg-surface p-4 md:block md:col-span-4`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold text-foreground">{tt("popKeywords")}</p>
              <button
                onClick={() => setKwOpen(true)}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-primary-ink transition hover:bg-background"
              >
                {tt("more")}
              </button>
            </div>
            <div className="inline-flex shrink-0 rounded-lg border border-border bg-background p-0.5">
              {(() => {
                const sc = ({ ko: ["한", "일", "중", "영"], ja: ["韓", "日", "中", "英"], zh: ["韩", "日", "中", "英"], en: ["KO", "JA", "ZH", "EN"] } as Record<string, string[]>)[lang];
                return [
                  ["전체", tt("all")],
                  ["KR", sc[0]],
                  ["JP", sc[1]],
                  ["CN", sc[2]],
                  ["EN", sc[3]],
                ] as [Lang | "전체", string][];
              })().map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setKwLang(k)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                    kwLang === k ? "bg-surface text-primary-ink shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {topKeywords.length > 0 ? (
            <div className="flex h-[72px] flex-wrap content-start gap-1.5 overflow-hidden">
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
            <p className="text-[12px] text-muted">{tt("noKeyword")}</p>
          )}
        </div>
      </section>

      {/* 모바일 전용: 트렌드 지표 펼치기/접기 */}
      <button
        onClick={() => setTrendOpen((v) => !v)}
        className="w-full rounded-xl border border-dashed border-border bg-surface py-2 text-[12.5px] font-bold text-primary-ink transition hover:bg-background md:hidden"
      >
        {trendOpen ? `▲ ${tt("trendLess")}` : `▼ ${tt("trendMore")}`}
      </button>

      {/* 하단: 조회수 TOP 클리닉 · 인기 시술 */}
      <section className={`${trendOpen ? "grid" : "hidden"} grid-cols-1 gap-4 md:grid md:grid-cols-12`}>
        <div className="rounded-2xl border border-border bg-surface p-4 md:col-span-2">
          <p className="mb-3 text-center text-[13px] font-bold text-foreground">
            {tt(reviewMode ? "topReviewers" : "topClinics")}
          </p>
          <div className="space-y-2.5">
            {ranked.length === 0 ? (
              <p className="py-3 text-[12px] text-muted">{tt("emptyPeriodAds")}</p>
            ) : null}
            {ranked.slice(0, 5).map((c, i) => (
              <RankRow
                key={c.clinic + i}
                i={i}
                name={tClinic(c.clinic, c.igUsername)}
                sub={tArea(c.area)}
                right={c.views != null ? `▶ ${fmt(c.views)}` : "▶ -"}
                href={c.igUsername ? `https://www.instagram.com/${c.igUsername}/` : undefined}
                oc="trend_account"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 md:col-span-2">
          <p className="mb-3 text-center text-[13px] font-bold text-foreground">{tt("topPosts")}</p>
          <div className="space-y-2.5">
            {topPosts.length === 0 ? (
              <p className="py-3 text-[12px] text-muted">{tt("emptyPosts")}</p>
            ) : null}
            {topPosts.map((a, i) => (
              <RankRow
                key={a.id}
                i={i}
                name={tClinic(a.clinic, a.igUsername)}
                right={`▶ ${fmt(a.views ?? a.likes)}`}
                onClick={() => onSelectAd?.(a)}
              />
            ))}
          </div>
        </div>

        <div
          title={tt("topAdvertisersTip")}
          className="rounded-2xl border border-border bg-surface p-4 md:col-span-2"
        >
          <p className="mb-3 text-center text-[13px] font-bold text-foreground">
            {tt("topAdvertisers")}
          </p>
          <div className="space-y-2.5">
            {leaderboard.length === 0 ? (
              // 전체 데이터 로딩 전엔 빈 문구 대신 로딩 표시 — '없음'으로 깜빡였다 채워지는 플래시 방지
              <p className="py-3 text-center text-[12px] text-muted">
                {dataPending ? "…" : tt("emptyPeriodAds")}
              </p>
            ) : null}
            {leaderboard.map((c, i) => (
              <RankRow
                key={c.clinic + i}
                i={i}
                name={tClinic(c.clinic, c.igUsername)}
                right={
                  <span title={`${c.ads}${tt("unit")} · ${c.days}${tt("dayUnit")}`}>
                    📅 {c.days}
                    {tt("dayUnit")}
                  </span>
                }
                href={c.igUsername ? `https://www.instagram.com/${c.igUsername}/` : undefined}
                oc="trend_leaderboard"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 md:col-span-3">
          <p className="mb-0.5 text-center text-[13px] font-bold text-foreground">
            {tt("popTreatments")}
          </p>
          {/* '수집 N건'과 모집단이 다르다는 오해 방지 — 7일 · 탭 대상 · 확정 분류만 */}
          <p className="mb-3 text-center text-[10.5px] text-muted">
            {tt(reviewMode ? "popTreatmentsHintReview" : "popTreatmentsHint")}
          </p>
          <div className="space-y-2.5">
            {topTreatments.length === 0 ? (
              <p className="text-[12px] text-muted">{tt("emptyTreatments")}</p>
            ) : null}
            {topTreatments.map((tr) => {
              const pct = Math.max(8, Math.round((tr.count / maxTreatment) * 100));
              return (
                <div key={tr.key} className="flex items-center gap-2 px-1.5">
                  <span className="w-16 shrink-0 truncate text-[12.5px] font-medium text-foreground">
                    {tTreatment(tr.key)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[12.5px] font-bold text-muted">
                    {tr.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 md:col-span-3">
          <p className="mb-3 text-center text-[13px] font-bold text-foreground">{tt("contentTypes")}</p>
          <div className="space-y-2.5">
            {topStyles.length === 0 ? (
              <p className="text-[12px] text-muted">{tt("emptyContent")}</p>
            ) : null}
            {topStyles.map(([key, count]) => {
              const pct = Math.max(8, Math.round((count / maxStyle) * 100));
              return (
                <div key={key} className="flex items-center gap-2 px-1.5">
                  <span className="w-20 shrink-0 truncate text-[12.5px] font-medium text-foreground">
                    {tContentType(key)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[12.5px] font-bold text-muted">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {kwOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setKwOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[15px] font-bold text-foreground">
                {tt("kwModalTitle")}{" "}
                <span className="text-[12px] font-medium text-muted">({kwCounts.length}{tt("countSuffix")})</span>
              </p>
              <button
                onClick={() => setKwOpen(false)}
                className="rounded-md px-2 py-1 text-[14px] text-muted transition hover:text-foreground"
              >
                ✕
              </button>
            </div>
            {kwCounts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {kwCounts.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="rounded-full bg-background px-2 py-1 text-[12px] font-medium text-primary-ink"
                  >
                    {tag} <span className="text-muted">{count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">{tt("noKeyword")}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
