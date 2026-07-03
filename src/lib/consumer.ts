// 소비자용 데이터 어셈블리 + 다국어 사전 — /jp(일본인 여행자)·/ko(한국인) 라우트 전용.
//
// 수집 스냅샷(ads/organic)을 그대로 읽어 언어별 콘텐츠만 추려 시술×지역 가이드를
// 구성한다. Apify 재호출 없음(조회 무료 원칙 유지). 페이지는 SSR로 렌더되어
// 검색(SEO) 유입을 노린다.
//
// 로케일별 포지셔닝이 다르다:
//  - jp: 여행자 가이드 (일본어 대응·다운타임·귀국 일정 중심)
//  - ko: 트렌드·이벤트 레이더 (지금 뜨는 시술·진행 중인 이벤트 중심 — 후기 플랫폼과
//        정면 경쟁하지 않는 데이터 각도)

import { Ad, Area, TreatmentKey, TREATMENTS } from "./ads";
import { KNOWN_CLINICS, KnownClinic } from "./clinics";
import { readSnapshot, readBlocklist, applyBlocklist, readApprovedClinics } from "./snapshot";

export type ConsumerLocale = "jp" | "ko";
export const CONSUMER_LOCALES: ConsumerLocale[] = ["jp", "ko"];

/** Ad.lang 매핑 — 로케일별로 보여줄 콘텐츠 언어 */
const CONTENT_LANG: Record<ConsumerLocale, Ad["lang"]> = { jp: "JP", ko: "KR" };

// ---------- 시술 가이드 (슬러그는 로케일 공통 → hreflang 짝 유지) ----------
// 효능 보장·최상급 표현 금지(의료광고 규제) — 일반 정보 + 개인차 고지로만 구성.

export interface TreatmentGuide {
  key: TreatmentKey;
  slug: string;
  /** 표시 이름 (로케일 언어) */
  name: string;
  /** 검색 보조 표기 (별칭) */
  alt: string;
  desc: string;
  time: string;
  downtime: string;
  tip: string;
}

const TREATMENT_GUIDES_JP: TreatmentGuide[] = [
  {
    key: "물광주사",
    slug: "water-glow",
    name: "水光注射",
    alt: "スキンボトックス・ツヤ肌注射",
    desc: "ヒアルロン酸などの美容成分を肌の浅い層に細かく注入し、内側からうるおいとツヤを与えるケア。韓国美容の定番メニューで、日本人旅行者に最も人気の高い施術のひとつです。",
    time: "約30〜60分(カウンセリング・麻酔クリーム含む)",
    downtime: "直後は赤みや小さな膨らみが出ることがあります(数時間〜数日・個人差あり)",
    tip: "翌日以降に観光予定を入れる方が多いです。帰国フライトとの間隔はクリニックの案内に従ってください。",
  },
  {
    key: "리프팅",
    slug: "lifting",
    name: "リフティング",
    alt: "ウルセラ・シュリンク・HIFU",
    desc: "超音波(HIFU)や高周波でフェイスラインを引き締めるリフトアップ系施術。機器の種類が豊富で、韓国はメニューの選択肢が多いのが特徴です。",
    time: "約30〜90分(範囲・機器による)",
    downtime: "ほぼなし〜数日の赤み・むくみ(個人差あり)",
    tip: "ダウンタイムが短いメニューが多く、旅行中でも受けやすいジャンルです。",
  },
  {
    key: "보톡스",
    slug: "botox",
    name: "ボトックス",
    alt: "エラボトックス・しわボトックス",
    desc: "エラ・額・目尻など気になる部位にピンポイントで注入する定番メニュー。施術時間が短く、旅行の合間に受けやすい施術です。",
    time: "約10〜20分",
    downtime: "ほぼなし(注入部位に軽い赤みが出ることがあります)",
    tip: "所要時間が短いため、観光スケジュールに組み込みやすい施術です。",
  },
  {
    key: "필러",
    slug: "filler",
    name: "ヒアルロン酸フィラー",
    alt: "唇・あご・ほうれい線フィラー",
    desc: "ヒアルロン酸で唇・あご・ほうれい線などのボリュームや輪郭を整える施術。デザインのカウンセリングが重要なので、日本語対応クリニックだと安心です。",
    time: "約15〜30分",
    downtime: "数日間、腫れや内出血が出る場合があります(個人差あり)",
    tip: "腫れが出る可能性があるため、帰国まで数日の余裕をもったスケジュールがおすすめです。",
  },
  {
    key: "미백토닝",
    slug: "toning",
    name: "美白・レーザートーニング",
    alt: "シミ・くすみケア",
    desc: "レーザーでシミ・くすみ・色ムラにアプローチするケア。1回でも受けられますが、本来は複数回の通院が前提のメニューです。",
    time: "約20〜40分",
    downtime: "ほぼなし(直後に軽い赤みが出ることがあります)",
    tip: "ダウンタイムが短く、帰国前日でも受けやすいメニューとして人気です。",
  },
  {
    key: "모공여드름",
    slug: "pore-acne",
    name: "毛穴・ニキビケア",
    alt: "毛穴縮小・ニキビ跡ケア",
    desc: "毛穴の開き・黒ずみ・ニキビ跡などを機器や薬剤でケアするジャンル。施術の種類が幅広いため、カウンセリングで肌状態に合わせて提案を受けるのが一般的です。",
    time: "施術内容による",
    downtime: "施術内容による(ピーリング系は赤み・皮むけが出ることがあります)",
    tip: "ダウンタイムの幅が大きいジャンルです。旅行日程を伝えて相談しましょう。",
  },
  {
    key: "스킨부스터",
    slug: "skin-booster",
    name: "スキンブースター",
    alt: "リジュラン・ジュベルック",
    desc: "リジュラン・ジュベルックなど、肌質そのものの改善を目指す注入系ケア。水光注射と並んで、韓国で受ける美容医療の代表メニューです。",
    time: "約30〜60分",
    downtime: "数日間、注入部位に赤みや小さなぷつぷつが残ることがあります(個人差あり)",
    tip: "直後は小さな注入跡が見えることがあるため、旅行前半に受ける方が多いです。",
  },
];

const TREATMENT_GUIDES_KO: TreatmentGuide[] = [
  {
    key: "물광주사",
    slug: "water-glow",
    name: "물광주사",
    alt: "물광·스킨보톡스",
    desc: "히알루론산 등 보습 성분을 피부 얕은 층에 촘촘히 주입해 수분과 광채를 채우는 시술. 이벤트가 가장 활발한 대표 시술이라 병원 간 비교가 쉬운 편입니다.",
    time: "약 30~60분 (상담·마취크림 포함)",
    downtime: "직후 붉은기·주사 자국이 며칠 갈 수 있음 (개인차)",
    tip: "이벤트가로 받을 땐 사용 제품과 용량, 첫 방문 한정 조건인지 확인해 보세요.",
  },
  {
    key: "리프팅",
    slug: "lifting",
    name: "리프팅",
    alt: "울쎄라·슈링크·HIFU",
    desc: "초음파(HIFU)·고주파로 처짐을 조여주는 리프팅 시술군. 기기 종류가 다양해 병원마다 라인업과 가격대가 크게 다릅니다. 최근 수집 데이터에서 게시물이 가장 많은 시술입니다.",
    time: "약 30~90분 (부위·기기에 따라)",
    downtime: "거의 없음 ~ 며칠간 붓기 (개인차)",
    tip: "기기 정품 인증 여부와 샷 수를 확인하는 것이 일반적입니다.",
  },
  {
    key: "보톡스",
    slug: "botox",
    name: "보톡스",
    alt: "턱보톡스·주름보톡스",
    desc: "사각턱·이마·눈가 등 부위별 포인트 시술. 시술 시간이 짧아 점심시간에 받는 경우도 흔합니다.",
    time: "약 10~20분",
    downtime: "거의 없음 (주사 부위에 가벼운 붉은기)",
    tip: "제제(국산/수입) 종류에 따라 가격대가 달라지니 어떤 제품인지 확인해 보세요.",
  },
  {
    key: "필러",
    slug: "filler",
    name: "필러",
    alt: "입술·턱·팔자 필러",
    desc: "히알루론산으로 볼륨과 윤곽을 보완하는 시술. 디자인 상담이 결과를 좌우하는 만큼 상담 과정을 충분히 갖는 것이 좋습니다.",
    time: "약 15~30분",
    downtime: "며칠간 붓기·멍이 생길 수 있음 (개인차)",
    tip: "중요한 일정이 있다면 최소 며칠 여유를 두고 받는 것이 일반적입니다.",
  },
  {
    key: "미백토닝",
    slug: "toning",
    name: "미백·토닝",
    alt: "잡티·색소 레이저",
    desc: "레이저로 잡티·색소·톤을 관리하는 시술. 1회보다 다회권 위주로 운영되는 병원이 많습니다.",
    time: "약 20~40분",
    downtime: "거의 없음 (직후 가벼운 붉은기)",
    tip: "다회권 이벤트가 흔한 시술이라 회당 단가로 비교하면 편합니다.",
  },
  {
    key: "모공여드름",
    slug: "pore-acne",
    name: "모공·여드름",
    alt: "모공 축소·여드름 흉터",
    desc: "모공 늘어짐·여드름·흉터를 기기와 약제로 관리하는 시술군. 피부 상태에 따라 제안이 달라져 상담이 특히 중요합니다.",
    time: "시술에 따라 다름",
    downtime: "시술에 따라 다름 (필링류는 붉은기·각질 탈락)",
    tip: "같은 고민이라도 피부 상태에 따라 시술이 달라지니 상담 후 결정하세요.",
  },
  {
    key: "스킨부스터",
    slug: "skin-booster",
    name: "스킨부스터",
    alt: "리쥬란·쥬베룩",
    desc: "리쥬란·쥬베룩 등 피부 자체의 컨디션 개선을 목표로 하는 주사 시술. 물광주사와 함께 꾸준히 수요가 많은 카테고리입니다.",
    time: "약 30~60분",
    downtime: "며칠간 주사 자국·붉은기 (개인차)",
    tip: "제품마다 목적이 달라, 상담 때 원하는 방향(결·탄력·재생)을 명확히 하면 좋습니다.",
  },
];

export const TREATMENT_GUIDES: Record<ConsumerLocale, TreatmentGuide[]> = {
  jp: TREATMENT_GUIDES_JP,
  ko: TREATMENT_GUIDES_KO,
};

export function guideBySlug(locale: ConsumerLocale, slug: string): TreatmentGuide | undefined {
  return TREATMENT_GUIDES[locale].find((g) => g.slug === slug);
}
export function guideByKey(locale: ConsumerLocale, key: TreatmentKey): TreatmentGuide {
  return TREATMENT_GUIDES[locale].find((g) => g.key === key)!;
}

// ---------- 지역 가이드 ----------

export interface AreaGuide {
  key: Area;
  slug: string;
  name: string;
  /** 보조 표기 (jp: 카나, ko: 권역 설명) */
  sub: string;
  desc: string;
  access: string;
}

const AREA_GUIDES_JP: AreaGuide[] = [
  {
    key: "강남",
    slug: "gangnam",
    name: "江南",
    sub: "カンナム",
    desc: "韓国美容クリニックの最激戦区。狎鴎亭(アックジョン)・新沙(シンサ)エリアも含め、専門クリニックが集中しています。",
    access: "地下鉄2号線・新盆唐線 江南駅ほか。金浦空港から地下鉄で約40〜50分。",
  },
  {
    key: "명동",
    slug: "myeongdong",
    name: "明洞",
    sub: "ミョンドン",
    desc: "観光の中心地で、ショッピングのついでに立ち寄りやすいエリア。日本語対応クリニックが特に密集しています。",
    access: "地下鉄4号線 明洞駅・2号線 乙支路入口駅。金浦空港から地下鉄で約40分。",
  },
  {
    key: "홍대",
    slug: "hongdae",
    name: "弘大",
    sub: "ホンデ",
    desc: "若者文化の中心エリア。カフェ巡りと合わせて訪れる旅行者に人気で、新しいクリニックが増えています。",
    access: "空港鉄道A'REX 弘大入口駅 — 金浦空港・仁川空港から乗り換えなしで直結。",
  },
];

const AREA_GUIDES_KO: AreaGuide[] = [
  {
    key: "강남",
    slug: "gangnam",
    name: "강남",
    sub: "압구정·신사 포함",
    desc: "미용 클리닉이 가장 밀집한 최대 격전지. 병원이 많은 만큼 이벤트 경쟁도 가장 치열한 지역입니다.",
    access: "2호선·신분당선 강남역, 3호선 압구정역·신사역 일대.",
  },
  {
    key: "명동",
    slug: "myeongdong",
    name: "명동",
    sub: "을지로 포함",
    desc: "직장인과 외국인 관광객이 함께 몰리는 지역. 외국인 대상 병원이 많아 야간·주말 진료가 활발한 편입니다.",
    access: "4호선 명동역, 2호선 을지로입구역 일대.",
  },
  {
    key: "홍대",
    slug: "hongdae",
    name: "홍대",
    sub: "합정·연남 포함",
    desc: "2030 중심 상권으로 신규 클리닉이 빠르게 늘고 있는 지역. 첫 방문 이벤트가 활발합니다.",
    access: "2호선·공항철도 홍대입구역 일대.",
  },
];

export const AREA_GUIDES: Record<ConsumerLocale, AreaGuide[]> = {
  jp: AREA_GUIDES_JP,
  ko: AREA_GUIDES_KO,
};

export function areaBySlug(locale: ConsumerLocale, slug: string): AreaGuide | undefined {
  return AREA_GUIDES[locale].find((a) => a.slug === slug);
}
export function areaByKey(locale: ConsumerLocale, key: Area): AreaGuide {
  return AREA_GUIDES[locale].find((a) => a.key === key)!;
}

// ---------- UI 문자열 사전 ----------

export interface FaqItem {
  q: string;
  a: string;
}

interface ConsumerUi {
  htmlLang: string;
  brandTag: string;
  navTreatments: string;
  navAreas: string;
  navOwner: string;
  heroPre: string;
  heroHi: string;
  heroDesc: string;
  heroStrong: string;
  heroTail: string;
  secTreatments: string;
  secAreas: string;
  secTopPosts: string;
  topPostsHint: string;
  secPromos: string;
  promosHint: string;
  promoDay: (n: number) => string;
  recentPosts: (n: number) => string;
  breadcrumbRoot: string;
  titleTreatmentPre: string;
  titleTreatmentPost: string;
  statLine: (clinics: number, posts: number) => string;
  statLineArea: (posts: number, treatment: string) => string;
  infoTime: string;
  infoDowntime: string;
  infoTip: string;
  secByArea: string;
  areaTreatmentLink: (area: string, treatment: string) => string;
  postsOf: (treatment: string) => string;
  postsOfArea: (area: string, treatment: string) => string;
  clinicsPosting: (treatment: string) => string;
  clinicsOfArea: (area: string) => string;
  otherTreatments: string;
  otherAreasFor: (treatment: string) => string;
  otherTreatmentsIn: (area: string) => string;
  secFaq: string;
  faq: FaqItem[];
  badge: Record<ClinicBadge, string>;
  clinicPostCount: (n: number) => string;
  gimpo: { tag: string; title: string; body: string; cta: string; href: string };
  showPromosOnLanding: boolean;
  disclaimer: string;
  meta: {
    layoutTitle: string;
    layoutTemplate: string;
    layoutDesc: string;
    landingTitle: string;
    landingDesc: string;
    treatmentTitle: (g: TreatmentGuide) => string;
    treatmentDesc: (g: TreatmentGuide) => string;
    comboTitle: (g: TreatmentGuide, a: AreaGuide) => string;
    comboDesc: (g: TreatmentGuide, a: AreaGuide) => string;
  };
}

export const CONSUMER_UI: Record<ConsumerLocale, ConsumerUi> = {
  jp: {
    htmlLang: "ja",
    brandTag: "韓国皮膚科ガイド",
    navTreatments: "施術から探す",
    navAreas: "エリアから探す",
    navOwner: "クリニック運営者向け",
    heroPre: "韓国の皮膚科を、",
    heroHi: "データで選ぶ",
    heroDesc:
      "江南・明洞・弘大のクリニックが実際に発信しているInstagram投稿を毎週収集。広告ではなく",
    heroStrong: "「いま本当に人気の施術・クリニック」",
    heroTail: "がわかる、日本人旅行者のための韓国皮膚科ガイドです。",
    secTreatments: "施術から探す",
    secAreas: "エリアから探す",
    secTopPosts: "いま人気の投稿",
    topPostsHint: "実際のInstagram投稿(タップで原文へ)",
    secPromos: "開催中のキャンペーン",
    promosHint: "長く配信されている広告ほど定番",
    promoDay: (n) => `配信${n}日目のキャンペーン`,
    recentPosts: (n) => `直近の投稿 ${n}件`,
    breadcrumbRoot: "韓国皮膚科ガイド",
    titleTreatmentPre: "韓国で",
    titleTreatmentPost: "を受けるなら",
    statLine: (c, p) => `直近90日、${c}クリニック・${p}件の日本語投稿を収集中`,
    statLineArea: (p, t) => `直近90日、このエリアで${p}件の${t}関連の日本語投稿を収集中`,
    infoTime: "⏱ 所要時間の目安",
    infoDowntime: "🩹 ダウンタイム",
    infoTip: "✈️ 旅行者向けメモ",
    secByArea: "エリア別に見る",
    areaTreatmentLink: (a, t) => `${a}で${t}`,
    postsOf: (t) => `${t}の人気投稿`,
    postsOfArea: (a, t) => `${a}の${t}人気投稿`,
    clinicsPosting: (t) => `${t}を発信しているクリニック`,
    clinicsOfArea: (a) => `${a}のクリニック`,
    otherTreatments: "ほかの施術も見る",
    otherAreasFor: (t) => `ほかのエリアで${t}`,
    otherTreatmentsIn: (a) => `${a}でほかの施術`,
    secFaq: "よくある質問",
    faq: [
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
    ],
    badge: { jp: "日本語対応", line: "LINE相談OK", multi: "多言語対応" },
    clinicPostCount: (n) => `直近90日の日本語投稿 ${n}件`,
    gimpo: {
      tag: "Airport Area Pick",
      title: "金浦空港エリアという選択肢 — YOU&I 金浦店",
      body: "羽田—金浦便を使うなら、金浦空港側のクリニックも便利です。ソウル中心部の混雑を避けて、フライト前後の時間を活用できます。皮膚科ネットワーク「YOU&I(ユーアンドアイ)」の金浦店は日本語Instagramアカウントで相談を受け付けています。",
      cta: "@youandi_gimpo_jp で相談する →",
      href: "https://www.instagram.com/youandi_gimpo_jp/",
    },
    showPromosOnLanding: false,
    disclaimer:
      "本ページは公開情報をもとにした情報提供のみを目的としており、特定の医療行為の勧誘・斡旋・仲介を行うものではありません。施術の効果・ダウンタイムには個人差があります。施術に関する判断は、必ず医療機関でのカウンセリングのうえで行ってください。",
    meta: {
      layoutTitle: "韓国皮膚科ガイド | DermaRadar",
      layoutTemplate: "%s | DermaRadar 韓国皮膚科ガイド",
      layoutDesc:
        "江南・明洞・弘大の皮膚科クリニックを、実際のInstagram投稿データから探せる日本人旅行者向けガイド。水光注射・リフティング・ボトックスなど人気施術ごとに紹介します。",
      landingTitle: "韓国皮膚科ガイド — 人気施術とクリニックをデータで探す",
      landingDesc:
        "韓国旅行で皮膚科に行くなら。江南・明洞・弘大のクリニックの実際のInstagram投稿データから、水光注射・リフティング・ボトックスなど人気施術と日本語対応クリニックを探せます。",
      treatmentTitle: (g) => `韓国で${g.name} — エリア別クリニックガイド`,
      treatmentDesc: (g) =>
        `韓国旅行で${g.name}(${g.alt})を受けるなら。江南・明洞・弘大の日本語対応クリニックと、実際のInstagram人気投稿をデータで紹介。所要時間・ダウンタイムの目安も解説します。`,
      comboTitle: (g, a) => `${a.name}(${a.sub})で${g.name} — 日本語対応クリニックと人気投稿`,
      comboDesc: (g, a) =>
        `${a.name}エリアで${g.name}(${g.alt})を受けたい方へ。日本語対応クリニックのInstagramと、実際の人気投稿をデータで紹介。アクセス・所要時間・ダウンタイムの目安も解説します。`,
    },
  },
  ko: {
    htmlLang: "ko",
    brandTag: "피부과 시술 가이드",
    navTreatments: "시술로 찾기",
    navAreas: "지역으로 찾기",
    navOwner: "병원 운영자용",
    heroPre: "요즘 피부과가 미는 시술을, ",
    heroHi: "데이터로",
    heroDesc: "강남·명동·홍대 피부과의 실제 인스타 게시물과 광고를 매주 수집합니다. 후기 몇 개가 아니라 ",
    heroStrong: "'지금 뜨는 시술과 진행 중인 이벤트'",
    heroTail: "를 데이터로 보여드립니다.",
    secTreatments: "시술로 찾기",
    secAreas: "지역으로 찾기",
    secTopPosts: "지금 인기 게시물",
    topPostsHint: "실제 인스타 게시물 (누르면 원문으로)",
    secPromos: "지금 진행 중인 이벤트",
    promosHint: "오래 집행되는 광고일수록 검증된 이벤트",
    promoDay: (n) => `집행 ${n}일째 이벤트`,
    recentPosts: (n) => `최근 게시물 ${n}건`,
    breadcrumbRoot: "피부과 시술 가이드",
    titleTreatmentPre: "",
    titleTreatmentPost: ", 어디서 받을까",
    statLine: (c, p) => `최근 90일, ${c}개 병원 · ${p}건의 게시물 수집 중`,
    statLineArea: (p, t) => `최근 90일, 이 지역에서 ${t} 관련 게시물 ${p}건 수집 중`,
    infoTime: "⏱ 소요 시간",
    infoDowntime: "🩹 다운타임",
    infoTip: "💡 체크 포인트",
    secByArea: "지역별로 보기",
    areaTreatmentLink: (a, t) => `${a} ${t}`,
    postsOf: (t) => `${t} 인기 게시물`,
    postsOfArea: (a, t) => `${a} ${t} 인기 게시물`,
    clinicsPosting: (t) => `${t} 게시물을 활발히 올리는 병원`,
    clinicsOfArea: (a) => `${a} 병원 목록`,
    otherTreatments: "다른 시술 보기",
    otherAreasFor: (t) => `다른 지역에서 ${t}`,
    otherTreatmentsIn: (a) => `${a}의 다른 시술`,
    secFaq: "자주 묻는 질문",
    faq: [
      {
        q: "예약은 어떻게 하나요?",
        a: "병원마다 인스타 DM, 카카오채널, 네이버 예약, 전화 등 채널이 다릅니다. 각 병원 인스타그램 프로필에 안내된 채널로 원하는 시술과 날짜를 문의하는 것이 일반적입니다.",
      },
      {
        q: "이벤트 가격은 어디서 확인하나요?",
        a: "이 사이트의 '진행 중인 이벤트'는 실제 집행 중인 광고를 수집해 보여드리는 것으로, 정확한 가격과 조건은 해당 게시물과 병원 안내에서 확인해야 합니다. 첫 방문 한정, 특정 용량 한정 등 조건이 붙는 경우가 많습니다.",
      },
      {
        q: "다운타임은 얼마나 되나요?",
        a: "시술과 개인에 따라 크게 다릅니다. 중요한 일정이 있다면 상담 때 일정을 말하고 시술 시기를 조절하는 것이 안전합니다.",
      },
      {
        q: "당일 예약도 되나요?",
        a: "자리가 있으면 당일 예약을 받는 병원도 있지만, 인기 병원·주말 시간대는 미리 예약하는 것이 좋습니다.",
      },
    ],
    badge: { jp: "일본어 대응", line: "LINE 상담", multi: "다국어 대응" },
    clinicPostCount: (n) => `최근 90일 게시물 ${n}건`,
    gimpo: {
      tag: "Area Pick",
      title: "김포에서 찾는다면 — 유앤아이의원 김포점",
      body: "강남까지 가지 않아도 되는 선택지. 피부과 네트워크 유앤아이(YOU&I)의 김포점은 김포한강신도시에 있어 김포·서부권 생활권에서 다니기 좋습니다.",
      cta: "유앤아이 김포점 알아보기 →",
      href: "https://www.gpuni114.co.kr/",
    },
    showPromosOnLanding: true,
    disclaimer:
      "본 페이지는 공개된 정보를 바탕으로 한 정보 제공만을 목적으로 하며, 특정 의료행위의 권유·알선·중개를 하지 않습니다. 시술의 효과와 다운타임에는 개인차가 있습니다. 시술에 관한 판단은 반드시 의료기관 상담을 거쳐 결정하세요.",
    meta: {
      layoutTitle: "피부과 시술 가이드 | DermaRadar",
      layoutTemplate: "%s | DermaRadar 피부과 시술 가이드",
      layoutDesc:
        "강남·명동·홍대 피부과의 실제 인스타 게시물·광고 데이터로 보는 시술 가이드. 요즘 뜨는 시술과 진행 중인 이벤트를 한눈에 확인하세요.",
      landingTitle: "피부과 시술 가이드 — 요즘 뜨는 시술과 이벤트를 데이터로",
      landingDesc:
        "강남·명동·홍대 피부과의 실제 인스타 게시물과 광고를 매주 수집해, 지금 인기 있는 시술과 진행 중인 이벤트를 보여드립니다. 물광주사·리프팅·보톡스 등 시술별 가이드 제공.",
      treatmentTitle: (g) => `${g.name} 어디서 받을까 — 강남·명동·홍대 데이터 가이드`,
      treatmentDesc: (g) =>
        `${g.name}(${g.alt}) 받을 병원을 찾는다면. 강남·명동·홍대 병원의 실제 인스타 게시물과 진행 중인 이벤트를 데이터로 비교하세요. 소요 시간·다운타임 정보 포함.`,
      comboTitle: (g, a) => `${a.name} ${g.name} — 병원·인기 게시물·진행 중 이벤트`,
      comboDesc: (g, a) =>
        `${a.name}에서 ${g.name}(${g.alt}) 받을 병원을 찾는다면. 실제 인스타 게시물과 진행 중인 이벤트를 데이터로 비교하세요.`,
    },
  },
};

// ---------- 스냅샷 → 로케일별 게시물/광고 ----------

export interface ConsumerData {
  /** 오가닉 게시물 (IG 자연 게시물, 로케일 언어) */
  posts: Ad[];
  /** 유료 광고 (진행 중 캠페인 → 이벤트/프로모션 정보) */
  ads: Ad[];
  collectedAt: string | null;
}

export async function loadConsumerData(locale: ConsumerLocale): Promise<ConsumerData> {
  const lang = CONTENT_LANG[locale];
  const [adsSnap, organicSnap, block] = await Promise.all([
    readSnapshot("ads"),
    readSnapshot("organic"),
    readBlocklist(),
  ]);
  const organic = applyBlocklist(organicSnap?.ads ?? [], block).filter(
    (a) => a.lang === lang
  );
  const paid = applyBlocklist(adsSnap?.ads ?? [], block).filter(
    (a) => a.lang === lang && a.kind !== "organic"
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

export function filterPosts(list: Ad[], treatment?: TreatmentKey, area?: Area): Ad[] {
  return list.filter(
    (a) => (!treatment || a.treatment === treatment) && (!area || a.area === area)
  );
}

// ---------- 클리닉 목록 (등록 명단 + 관리자 승인 병원) ----------

export type ClinicBadge = "jp" | "line" | "multi";

export interface ConsumerClinic {
  name: string;
  handle: string;
  areas: Area[];
  badges: ClinicBadge[];
  /** 최근 90일 게시물 수 (로케일 언어 기준) */
  postCount: number;
  /** 게시물 반응 합계 (정렬용) */
  reach: number;
  instagramUrl: string;
}

/** note/핸들에서 배지 키 파생 (내부 메모 원문을 노출하지 않기 위한 장치) */
function deriveBadges(c: { handle: string; note?: string }): ClinicBadge[] {
  const src = `${c.handle} ${c.note ?? ""}`.toLowerCase();
  const badges: ClinicBadge[] = [];
  if (/jp|jpn|japan|일본어|일본인/.test(src)) badges.push("jp");
  if (/line/.test(src)) badges.push("line");
  if (/글로벌|global|다국어|영어|영문|multilingual/.test(src)) badges.push("multi");
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

// ---------- hreflang 짝 (로케일 공통 슬러그 전제) ----------

export function altLanguages(subPath: string): Record<string, string> {
  return { ja: `/jp${subPath}`, ko: `/ko${subPath}` };
}
