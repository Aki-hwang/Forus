// 소비자(일본인 여행자)용 데이터 어셈블리 — /jp 라우트 전용, 서버 컴포넌트에서만 사용.
//
// 수집 스냅샷(ads/organic)을 그대로 읽어 일본어 콘텐츠만 추려 시술×지역 가이드 페이지를
// 구성한다. Apify 재호출 없음(조회 무료 원칙 유지). 페이지는 SSR로 렌더되어
// 일본어 검색(SEO) 유입을 노린다.

import { Ad, Area, TreatmentKey, TREATMENTS, TREATMENT_LABEL } from "./ads";
import { KNOWN_CLINICS, KnownClinic } from "./clinics";
import { readSnapshot, readBlocklist, applyBlocklist, readApprovedClinics } from "./snapshot";

// ---------- 시술 슬러그 + 일본어 가이드 카피 ----------
// 효능 보장·최상급 표현 금지(의료광고 규제) — 일반 정보 + 개인차 고지로만 구성.

export interface TreatmentGuide {
  key: TreatmentKey;
  slug: string;
  ja: string;
  /** 검색 보조 표기 (카나·별칭) */
  jaAlt: string;
  desc: string;
  time: string;
  downtime: string;
  travelTip: string;
}

export const TREATMENT_GUIDES: TreatmentGuide[] = [
  {
    key: "물광주사",
    slug: "water-glow",
    ja: "水光注射",
    jaAlt: "スキンボトックス・ツヤ肌注射",
    desc: "ヒアルロン酸などの美容成分を肌の浅い層に細かく注入し、内側からうるおいとツヤを与えるケア。韓国美容の定番メニューで、日本人旅行者に最も人気の高い施術のひとつです。",
    time: "約30〜60分(カウンセリング・麻酔クリーム含む)",
    downtime: "直後は赤みや小さな膨らみが出ることがあります(数時間〜数日・個人差あり)",
    travelTip: "翌日以降に観光予定を入れる方が多いです。帰国フライトとの間隔はクリニックの案内に従ってください。",
  },
  {
    key: "리프팅",
    slug: "lifting",
    ja: "リフティング",
    jaAlt: "ウルセラ・シュリンク・HIFU",
    desc: "超音波(HIFU)や高周波でフェイスラインを引き締めるリフトアップ系施術。機器の種類が豊富で、韓国はメニューの選択肢が多いのが特徴です。",
    time: "約30〜90分(範囲・機器による)",
    downtime: "ほぼなし〜数日の赤み・むくみ(個人差あり)",
    travelTip: "ダウンタイムが短いメニューが多く、旅行中でも受けやすいジャンルです。",
  },
  {
    key: "보톡스",
    slug: "botox",
    ja: "ボトックス",
    jaAlt: "エラボトックス・しわボトックス",
    desc: "エラ・額・目尻など気になる部位にピンポイントで注入する定番メニュー。施術時間が短く、旅行の合間に受けやすい施術です。",
    time: "約10〜20分",
    downtime: "ほぼなし(注入部位に軽い赤みが出ることがあります)",
    travelTip: "所要時間が短いため、観光スケジュールに組み込みやすい施術です。",
  },
  {
    key: "필러",
    slug: "filler",
    ja: "ヒアルロン酸フィラー",
    jaAlt: "唇・あご・ほうれい線フィラー",
    desc: "ヒアルロン酸で唇・あご・ほうれい線などのボリュームや輪郭を整える施術。デザインのカウンセリングが重要なので、日本語対応クリニックだと安心です。",
    time: "約15〜30分",
    downtime: "数日間、腫れや内出血が出る場合があります(個人差あり)",
    travelTip: "腫れが出る可能性があるため、帰国まで数日の余裕をもったスケジュールがおすすめです。",
  },
  {
    key: "미백토닝",
    slug: "toning",
    ja: "美白・レーザートーニング",
    jaAlt: "シミ・くすみケア",
    desc: "レーザーでシミ・くすみ・色ムラにアプローチするケア。1回でも受けられますが、本来は複数回の通院が前提のメニューです。",
    time: "約20〜40分",
    downtime: "ほぼなし(直後に軽い赤みが出ることがあります)",
    travelTip: "ダウンタイムが短く、帰国前日でも受けやすいメニューとして人気です。",
  },
  {
    key: "모공여드름",
    slug: "pore-acne",
    ja: "毛穴・ニキビケア",
    jaAlt: "毛穴縮小・ニキビ跡ケア",
    desc: "毛穴の開き・黒ずみ・ニキビ跡などを機器や薬剤でケアするジャンル。施術の種類が幅広いため、カウンセリングで肌状態に合わせて提案を受けるのが一般的です。",
    time: "施術内容による",
    downtime: "施術内容による(ピーリング系は赤み・皮むけが出ることがあります)",
    travelTip: "ダウンタイムの幅が大きいジャンルです。旅行日程を伝えて相談しましょう。",
  },
  {
    key: "스킨부스터",
    slug: "skin-booster",
    ja: "スキンブースター",
    jaAlt: "リジュラン・ジュベルック",
    desc: "リジュラン・ジュベルックなど、肌質そのものの改善を目指す注入系ケア。水光注射と並んで、韓国で受ける美容医療の代表メニューです。",
    time: "約30〜60分",
    downtime: "数日間、注入部位に赤みや小さなぷつぷつが残ることがあります(個人差あり)",
    travelTip: "直後は小さな注入跡が見えることがあるため、旅行前半に受ける方が多いです。",
  },
];

export function guideBySlug(slug: string): TreatmentGuide | undefined {
  return TREATMENT_GUIDES.find((g) => g.slug === slug);
}
export function guideByKey(key: TreatmentKey): TreatmentGuide {
  return TREATMENT_GUIDES.find((g) => g.key === key)!;
}

// ---------- 지역 슬러그 + 일본어 카피 ----------

export interface AreaGuide {
  key: Area;
  slug: string;
  ja: string;
  kana: string;
  desc: string;
  access: string;
}

export const AREA_GUIDES: AreaGuide[] = [
  {
    key: "강남",
    slug: "gangnam",
    ja: "江南",
    kana: "カンナム",
    desc: "韓国美容クリニックの最激戦区。狎鴎亭(アックジョン)・新沙(シンサ)エリアも含め、専門クリニックが集中しています。",
    access: "地下鉄2号線・新盆唐線 江南駅ほか。金浦空港から地下鉄で約40〜50分。",
  },
  {
    key: "명동",
    slug: "myeongdong",
    ja: "明洞",
    kana: "ミョンドン",
    desc: "観光の中心地で、ショッピングのついでに立ち寄りやすいエリア。日本語対応クリニックが特に密集しています。",
    access: "地下鉄4号線 明洞駅・2号線 乙支路入口駅。金浦空港から地下鉄で約40分。",
  },
  {
    key: "홍대",
    slug: "hongdae",
    ja: "弘大",
    kana: "ホンデ",
    desc: "若者文化の中心エリア。カフェ巡りと合わせて訪れる旅行者に人気で、新しいクリニックが増えています。",
    access: "空港鉄道A'REX 弘大入口駅 — 金浦空港・仁川空港から乗り換えなしで直結。",
  },
];

export function areaBySlug(slug: string): AreaGuide | undefined {
  return AREA_GUIDES.find((a) => a.slug === slug);
}
export function areaByKey(key: Area): AreaGuide {
  return AREA_GUIDES.find((a) => a.key === key)!;
}

// ---------- 스냅샷 → 일본어 게시물/광고 ----------

export interface ConsumerData {
  /** 일본어 오가닉 게시물 (IG 자연 게시물) */
  posts: Ad[];
  /** 일본어 유료 광고 (진행 중 캠페인 → 프로모션 정보) */
  ads: Ad[];
  collectedAt: string | null;
}

export async function loadConsumerData(): Promise<ConsumerData> {
  const [adsSnap, organicSnap, block] = await Promise.all([
    readSnapshot("ads"),
    readSnapshot("organic"),
    readBlocklist(),
  ]);
  const organic = applyBlocklist(organicSnap?.ads ?? [], block).filter(
    (a) => a.lang === "JP"
  );
  const paid = applyBlocklist(adsSnap?.ads ?? [], block).filter(
    (a) => a.lang === "JP" && a.kind !== "organic"
  );
  // 게시물 반응 순 정렬 (조회수 > 좋아요+저장)
  organic.sort((a, b) => engagement(b) - engagement(a));
  // 광고는 집행일수 순 (오래 도는 광고 = 검증된 프로모션)
  paid.sort((a, b) => (b.activeDays ?? 0) - (a.activeDays ?? 0));
  return {
    posts: organic,
    ads: paid,
    collectedAt: organicSnap?.collectedAt ?? adsSnap?.collectedAt ?? null,
  };
}

export function engagement(a: Ad): number {
  if (typeof a.views === "number" && a.views > 0) return a.views;
  return (a.likes ?? 0) + (a.saves ?? 0);
}

export function filterPosts(
  list: Ad[],
  treatment?: TreatmentKey,
  area?: Area
): Ad[] {
  return list.filter(
    (a) =>
      (!treatment || a.treatment === treatment) && (!area || a.area === area)
  );
}

// ---------- 클리닉 목록 (등록 명단 + 관리자 승인 병원) ----------

export interface ConsumerClinic {
  name: string;
  handle: string;
  areas: Area[];
  /** 일본어 대응/LINE 등 파생 배지 */
  badges: string[];
  /** 최근 90일 일본어 게시물 수 */
  postCount: number;
  /** 게시물 반응 합계 (정렬용) */
  reach: number;
  instagramUrl: string;
}

/** note/핸들에서 소비자용 배지 파생 (한국어 메모를 노출하지 않기 위한 장치) */
function deriveBadges(c: { handle: string; note?: string }): string[] {
  const src = `${c.handle} ${c.note ?? ""}`.toLowerCase();
  const badges: string[] = [];
  if (/jp|jpn|japan|일본어|일본인/.test(src)) badges.push("日本語対応");
  if (/line/.test(src)) badges.push("LINE相談OK");
  if (/글로벌|global|다국어|영어|영문|multilingual/.test(src)) badges.push("多言語対応");
  return badges;
}

export async function clinicsFor(
  posts: Ad[],
  area?: Area,
  treatment?: TreatmentKey
): Promise<ConsumerClinic[]> {
  const approved = await readApprovedClinics();
  const all: { name: string; handle: string; areas: Area[]; note?: string }[] = [
    ...KNOWN_CLINICS.map((c: KnownClinic) => ({
      name: c.name,
      handle: c.handle,
      areas: c.areas,
      note: c.note,
    })),
    ...approved.map((c) => ({
      name: c.name,
      handle: c.handle,
      areas: c.areas as Area[],
      note: undefined,
    })),
  ];
  // 핸들 중복 제거 (등록 명단 우선)
  const seen = new Set<string>();
  const uniq = all.filter((c) => {
    const h = c.handle.toLowerCase();
    if (!h || seen.has(h)) return false;
    seen.add(h);
    return true;
  });

  const scoped = area ? uniq.filter((c) => c.areas.includes(area)) : uniq;

  // 게시물 활동으로 정렬 근거 산출 (시술 필터가 있으면 그 시술 게시물만 계산)
  const byHandle = new Map<string, Ad[]>();
  for (const p of posts) {
    const h = p.igUsername?.toLowerCase();
    if (!h) continue;
    (byHandle.get(h) ?? byHandle.set(h, []).get(h)!).push(p);
  }

  return scoped
    .map((c) => {
      const own = byHandle.get(c.handle.toLowerCase()) ?? [];
      const rel = treatment ? own.filter((p) => p.treatment === treatment) : own;
      return {
        name: c.name,
        handle: c.handle,
        areas: c.areas,
        badges: deriveBadges(c),
        postCount: rel.length,
        reach: rel.reduce((s, p) => s + engagement(p), 0),
        instagramUrl: `https://www.instagram.com/${c.handle}/`,
      };
    })
    .sort((x, y) => y.postCount - x.postCount || y.reach - x.reach);
}

// ---------- 통계 (페이지 인트로용) ----------

export interface GuideStats {
  postCount: number;
  clinicCount: number;
  adCount: number;
}

export function statsFor(
  data: ConsumerData,
  treatment?: TreatmentKey,
  area?: Area
): GuideStats {
  const posts = filterPosts(data.posts, treatment, area);
  const ads = filterPosts(data.ads, treatment, area);
  const handles = new Set(
    [...posts, ...ads].map((a) => a.igUsername?.toLowerCase()).filter(Boolean)
  );
  return { postCount: posts.length, clinicCount: handles.size, adCount: ads.length };
}

/** 시술별 게시물 수 (랜딩 카드용) */
export function treatmentCounts(data: ConsumerData): Map<TreatmentKey, number> {
  const m = new Map<TreatmentKey, number>();
  for (const t of TREATMENTS) m.set(t, 0);
  for (const p of data.posts) m.set(p.treatment, (m.get(p.treatment) ?? 0) + 1);
  return m;
}

export const TREATMENT_LABEL_JA = (key: TreatmentKey): string =>
  TREATMENT_LABEL[key].jp;

// ---------- 공통 FAQ (SEO/JSON-LD 공용) ----------

export interface FaqItem {
  q: string;
  a: string;
}

export const COMMON_FAQ: FaqItem[] = [
  {
    q: "予約はどうすればいいですか?",
    a: "多くのクリニックがInstagramのDMやLINEで日本語の問い合わせに対応しています。各クリニックのInstagramプロフィールに記載されている連絡先から、希望日時と施術内容を伝えて予約するのが一般的です。",
  },
  {
    q: "日本語は通じますか?",
    a: "このガイドに掲載しているクリニックの多くは、日本語スタッフの常駐や日本語カウンセリング・LINE対応など、日本人向けのサポート体制を持っています。対応状況はクリニックごとに異なるため、予約時に確認してください。",
  },
  {
    q: "支払い方法は?",
    a: "ほとんどのクリニックでクレジットカードが使えます。現金(ウォン)割引を行っているところもあります。詳細は各クリニックにお問い合わせください。",
  },
  {
    q: "旅行中に受けても大丈夫?",
    a: "施術によってダウンタイム(赤み・腫れなど)の程度が異なります。帰国フライトや観光の予定を伝えたうえで、カウンセリングで相談することをおすすめします。",
  },
  {
    q: "当日予約はできますか?",
    a: "空きがあれば当日予約に対応するクリニックもありますが、人気クリニックは数日前の予約がおすすめです。特に週末は混み合います。",
  },
];

export const CONSUMER_DISCLAIMER =
  "本ページは公開情報をもとにした情報提供のみを目的としており、特定の医療行為の勧誘・斡旋・仲介を行うものではありません。施術の効果・ダウンタイムには個人差があります。施術に関する判断は、必ず医療機関でのカウンセリングのうえで行ってください。";
