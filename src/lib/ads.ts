// 광고 데이터 모델 + 목업 데이터 + 트렌드 집계
// 추후 실제 수집(Meta Ad Library / 크롤러)으로 교체할 때 이 모듈만 바꾸면 됩니다.

export type Area = "강남" | "명동" | "홍대";
export type Lang = "JP" | "CN";

export type TreatmentKey =
  | "물광주사"
  | "리프팅"
  | "보톡스"
  | "필러"
  | "미백토닝"
  | "모공여드름"
  | "스킨부스터";

export type StyleKey = "미니멀" | "비포애프터" | "감성" | "프로모션" | "정보형";

export interface Ad {
  id: string;
  clinic: string;
  area: Area;
  treatment: TreatmentKey;
  /** 크리에이티브에 들어가는 메인 카피 (타겟 언어) */
  headline: string;
  sub: string;
  /** 인스타 캡션 */
  caption: string;
  hashtags: string[];
  /** 한국어 트렌드 태그 */
  tags: string[];
  style: StyleKey;
  /** 크리에이티브 배경 그라데이션 (from, to) */
  palette: [string, string];
  likes: number;
  saves: number;
  lang: Lang;
  /** 게시 추정일 */
  date: string;

  // ---- 실시간 수집(Meta 광고 라이브러리) 전용 메타 — 목업에는 없음 ----
  /** 실시간 수집 광고 여부 */
  live?: boolean;
  /** 클릭 시 이동할 원본 링크 (랜딩/LINE/인스타 등) */
  sourceUrl?: string;
  /** 광고 라이브러리 항목 직링크 */
  adLibraryUrl?: string;
  /** 광고 CTA 문구 (예: Book now) */
  cta?: string;
  /** 노출 플랫폼 (FACEBOOK / INSTAGRAM / ...) */
  platforms?: string[];
  /** 집행 일수 (start ~ end/today) */
  activeDays?: number;
  /** 광고주(페이지명) 원본 */
  advertiser?: string;
}

export const AREAS: Area[] = ["강남", "명동", "홍대"];

export const TREATMENTS: TreatmentKey[] = [
  "물광주사",
  "리프팅",
  "보톡스",
  "필러",
  "미백토닝",
  "모공여드름",
  "스킨부스터",
];

export const TREATMENT_LABEL: Record<TreatmentKey, { ko: string; jp: string }> = {
  물광주사: { ko: "물광주사", jp: "水光注射" },
  리프팅: { ko: "리프팅", jp: "リフティング" },
  보톡스: { ko: "보톡스", jp: "ボトックス" },
  필러: { ko: "필러", jp: "フィラー" },
  미백토닝: { ko: "미백·토닝", jp: "美白・トーニング" },
  모공여드름: { ko: "모공·여드름", jp: "毛穴・ニキビケア" },
  스킨부스터: { ko: "스킨부스터", jp: "スキンブースター" },
};

export const STYLE_LABEL: Record<StyleKey, string> = {
  미니멀: "미니멀",
  비포애프터: "비포&애프터",
  감성: "감성",
  프로모션: "프로모션",
  정보형: "정보형",
};

export const ads: Ad[] = [
  {
    id: "gn-glow-01",
    clinic: "라온 피부과 (강남)",
    area: "강남",
    treatment: "물광주사",
    headline: "韓国で叶える、\nうるツヤ素肌",
    sub: "水光注射 スペシャルケア",
    caption:
      "江南で人気の水光注射✨ 旅行中でも受けられる時短ケアで、ツヤ肌をお持ち帰り。日本語スタッフ常駐で安心🇯🇵",
    hashtags: ["#韓国美容", "#水光注射", "#江南皮膚科", "#韓国旅行", "#美肌"],
    tags: ["물광", "톤업", "수분"],
    style: "감성",
    palette: ["#a7f3d0", "#5eead4"],
    likes: 3120,
    saves: 842,
    lang: "JP",
    date: "2026-05-28",
  },
  {
    id: "gn-lift-02",
    clinic: "셀린 의원 (강남)",
    area: "강남",
    treatment: "리프팅",
    headline: "たるみ知らずの\nVライン",
    sub: "高密度リフティング",
    caption:
      "1回でキュッと引き上げ。江南で話題のリフティングを日本語カウンセリングで。来院前にLINEで無料相談💬",
    hashtags: ["#韓国リフティング", "#Vライン", "#小顔", "#江南美容", "#糸リフト"],
    tags: ["리프팅", "탄력", "V라인"],
    style: "비포애프터",
    palette: ["#fbcfe8", "#f9a8d4"],
    likes: 5240,
    saves: 1530,
    lang: "JP",
    date: "2026-06-02",
  },
  {
    id: "md-white-03",
    clinic: "뮤즈 클리닉 (명동)",
    area: "명동",
    treatment: "미백토닝",
    headline: "くすみオフで\nワントーン上の肌へ",
    sub: "美白トーニング 集中ケア",
    caption:
      "明洞すぐ✨ 観光のついでに寄れる美白トーニング。色ムラ・くすみをケアして透明感アップ🤍",
    hashtags: ["#美白", "#トーニング", "#明洞皮膚科", "#韓国スキンケア", "#透明感"],
    tags: ["미백", "톤업", "잡티"],
    style: "미니멀",
    palette: ["#bae6fd", "#7dd3fc"],
    likes: 2870,
    saves: 690,
    lang: "JP",
    date: "2026-05-20",
  },
  {
    id: "hd-pore-04",
    clinic: "온뜰 피부과 (홍대)",
    area: "홍대",
    treatment: "모공여드름",
    headline: "毛穴レス肌、\n韓国で本気ケア",
    sub: "毛穴・ニキビ 集中プログラム",
    caption:
      "ホンデで話題の毛穴ケア🌿 ニキビ跡・黒ずみをまとめてケア。学生さんに人気の学割あり🎓",
    hashtags: ["#毛穴ケア", "#ニキビ", "#弘大皮膚科", "#韓国美容", "#ツルツル肌"],
    tags: ["모공", "여드름", "트러블"],
    style: "정보형",
    palette: ["#ddd6fe", "#c4b5fd"],
    likes: 1980,
    saves: 530,
    lang: "JP",
    date: "2026-06-08",
  },
  {
    id: "gn-botox-05",
    clinic: "프리미아 성형외과 (강남)",
    area: "강남",
    treatment: "보톡스",
    headline: "自然な若見え、\nエラ・シワに",
    sub: "ボトックス お試しプラン",
    caption:
      "エラ・額・目尻、気になる所だけピンポイントで。江南エリアの実績クリニックで安心施術✨",
    hashtags: ["#ボトックス", "#エラボトックス", "#韓国美容", "#江南", "#若見え"],
    tags: ["보톡스", "주름", "동안"],
    style: "프로모션",
    palette: ["#fde68a", "#fcd34d"],
    likes: 4130,
    saves: 1120,
    lang: "JP",
    date: "2026-06-05",
  },
  {
    id: "md-filler-06",
    clinic: "벨르 클리닉 (명동)",
    area: "명동",
    treatment: "필러",
    headline: "横顔美人、\nヒアルロン酸で",
    sub: "フィラー 立体感デザイン",
    caption:
      "鼻・唇・あごのバランスを自然にデザイン。明洞で日本語OKのフィラー専門カウンセリング💉",
    hashtags: ["#フィラー", "#ヒアルロン酸", "#横顔美人", "#明洞美容", "#韓国整形"],
    tags: ["필러", "윤곽", "볼륨"],
    style: "비포애프터",
    palette: ["#fecaca", "#fca5a5"],
    likes: 3560,
    saves: 980,
    lang: "JP",
    date: "2026-05-31",
  },
  {
    id: "hd-booster-07",
    clinic: "글로우랩 (홍대)",
    area: "홍대",
    treatment: "스킨부스터",
    headline: "内側から発光、\nうるおい貯金",
    sub: "スキンブースター 水分チャージ",
    caption:
      "乾燥肌さんに👏 ヒアルロン酸スキンブースターで内側からぷるん。ホンデのおしゃれクリニック🌷",
    hashtags: ["#スキンブースター", "#うるおい", "#弘大", "#韓国美容", "#乾燥肌"],
    tags: ["수분", "광채", "탄력"],
    style: "감성",
    palette: ["#a5f3fc", "#67e8f9"],
    likes: 2240,
    saves: 610,
    lang: "JP",
    date: "2026-06-11",
  },
  {
    id: "gn-glow-08",
    clinic: "더마린 의원 (강남)",
    area: "강남",
    treatment: "물광주사",
    headline: "ツヤ肌チャージ、\n弾力もUP",
    sub: "水光 + 弾力ブースター",
    caption:
      "結婚式・撮影前の駆け込みケアに✨ 江南で人気の水光プログラム。当日予約も日本語でOK💬",
    hashtags: ["#水光注射", "#ブライダル", "#韓国美容", "#江南皮膚科", "#ツヤ肌"],
    tags: ["물광", "탄력", "광채"],
    style: "프로모션",
    palette: ["#bbf7d0", "#86efac"],
    likes: 6010,
    saves: 1870,
    lang: "JP",
    date: "2026-06-14",
  },
  {
    id: "md-lift-09",
    clinic: "리아 피부과 (명동)",
    area: "명동",
    treatment: "리프팅",
    headline: "ノーダウンタイムで\n引き上げ",
    sub: "ウルトラリフティング",
    caption:
      "観光の合間に🕊 ダウンタイムほぼなしのリフティング。明洞駅すぐ、日本語カウンセラー在籍。",
    hashtags: ["#リフティング", "#ウルセラ", "#明洞", "#韓国美容", "#小顔"],
    tags: ["리프팅", "탄력", "V라인"],
    style: "정보형",
    palette: ["#f5d0fe", "#e9a8fc"],
    likes: 3380,
    saves: 870,
    lang: "JP",
    date: "2026-06-09",
  },
  {
    id: "hd-white-10",
    clinic: "코코 클리닉 (홍대)",
    area: "홍대",
    treatment: "미백토닝",
    headline: "色白透明感、\n韓国トーニング",
    sub: "美白レーザートーニング",
    caption:
      "シミ・そばかすが気になる方へ🤍 弘大のトーニング専門。回数券でお得にケア✨",
    hashtags: ["#トーニング", "#美白", "#弘大皮膚科", "#シミケア", "#韓国スキンケア"],
    tags: ["미백", "잡티", "톤업"],
    style: "미니멀",
    palette: ["#c7d2fe", "#a5b4fc"],
    likes: 2590,
    saves: 720,
    lang: "JP",
    date: "2026-06-03",
  },
  // 향후 중국인 타겟 확장 예시 (로드맵)
  {
    id: "gn-glow-cn-11",
    clinic: "라온 피부과 (강남)",
    area: "강남",
    treatment: "물광주사",
    headline: "韩国水光针，\n素颜也发光",
    sub: "江南热门 水光护理",
    caption:
      "来江南打卡同款水光针✨ 旅行途中也能做的快速护理，中文客服全程陪同🇨🇳",
    hashtags: ["#韩国美容", "#水光针", "#江南皮肤科", "#韩国旅行", "#素颜肌"],
    tags: ["물광", "톤업", "수분"],
    style: "감성",
    palette: ["#fecdd3", "#fda4af"],
    likes: 4480,
    saves: 1290,
    lang: "CN",
    date: "2026-06-12",
  },
  {
    id: "md-lift-cn-12",
    clinic: "셀린 의원 (강남)",
    area: "강남",
    treatment: "리프팅",
    headline: "紧致V脸，\n一次见效",
    sub: "高密度 提升线雕",
    caption:
      "江南口碑提升项目，中文一对一咨询。来韩前加微信免费评估面部💬",
    hashtags: ["#韩国提升", "#V脸", "#小脸", "#江南医美", "#线雕"],
    tags: ["리프팅", "탄력", "V라인"],
    style: "비포애프터",
    palette: ["#fed7aa", "#fdba74"],
    likes: 5120,
    saves: 1610,
    lang: "CN",
    date: "2026-06-13",
  },
];

// ---------- 트렌드 집계 ----------

export interface TrendSummary {
  total: number;
  byArea: { area: Area; count: number }[];
  byTreatment: { key: TreatmentKey; label: string; count: number }[];
  byStyle: { key: StyleKey; label: string; count: number }[];
  topTags: { tag: string; count: number }[];
  topPalettes: [string, string][];
  avgEngagement: number;
  hottest: Ad | null;
}

export function summarizeTrends(list: Ad[]): TrendSummary {
  const byAreaMap = new Map<Area, number>();
  const byTreatmentMap = new Map<TreatmentKey, number>();
  const byStyleMap = new Map<StyleKey, number>();
  const tagMap = new Map<string, number>();

  for (const ad of list) {
    byAreaMap.set(ad.area, (byAreaMap.get(ad.area) ?? 0) + 1);
    byTreatmentMap.set(ad.treatment, (byTreatmentMap.get(ad.treatment) ?? 0) + 1);
    byStyleMap.set(ad.style, (byStyleMap.get(ad.style) ?? 0) + 1);
    for (const t of ad.tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
  }

  const byArea = AREAS.map((area) => ({ area, count: byAreaMap.get(area) ?? 0 }));

  const byTreatment = [...byTreatmentMap.entries()]
    .map(([key, count]) => ({ key, label: TREATMENT_LABEL[key].ko, count }))
    .sort((a, b) => b.count - a.count);

  const byStyle = [...byStyleMap.entries()]
    .map(([key, count]) => ({ key, label: STYLE_LABEL[key], count }))
    .sort((a, b) => b.count - a.count);

  const topTags = [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const sorted = [...list].sort(
    (a, b) => b.likes + b.saves - (a.likes + a.saves)
  );

  const topPalettes = sorted.slice(0, 5).map((a) => a.palette);

  const avgEngagement = list.length
    ? Math.round(list.reduce((s, a) => s + a.likes + a.saves, 0) / list.length)
    : 0;

  return {
    total: list.length,
    byArea,
    byTreatment,
    byStyle,
    topTags,
    topPalettes,
    avgEngagement,
    hottest: sorted[0] ?? null,
  };
}

export function getAd(id: string): Ad | undefined {
  return ads.find((a) => a.id === id);
}
