// 레퍼런스 광고 기반 "우리 광고" 자동 생성기
// 지금은 템플릿 + 변형 시드 기반. 추후 LLM/이미지 생성 API로 core 만 교체하면 됩니다.

import { Ad, Lang, TreatmentKey, TREATMENT_LABEL } from "./ads";

export interface GenerateRequest {
  referenceId: string;
  clinicName: string;
  area?: string;
  lang: Lang;
  /** 변형 번호 (다른 버전 생성용) */
  seed?: number;
}

export interface GeneratedCreative {
  clinicName: string;
  treatmentKo: string;
  treatmentLabel: string;
  lang: Lang;
  headline: string;
  sub: string;
  caption: string;
  hashtags: string[];
  palette: [string, string];
  style: string;
  /** 레퍼런스에서 우리가 차용한 특징 (사람이 읽는 인사이트) */
  borrowedFrom: string[];
  imagePrompt: string;
  seed: number;
}

interface CopyBank {
  headlines: string[];
  subs: string[];
  captionLead: string[];
  captionTrust: string[];
  hashtags: string[];
}

// 시술별 · 언어별 카피 뱅크
// 카피 뱅크는 일본어/중국어만 보유 (KR 등은 generateCreative 에서 JP 로 폴백)
const BANK: Record<TreatmentKey, Record<"JP" | "CN", CopyBank>> = {
  물광주사: {
    JP: {
      headlines: ["うるツヤ素肌、\n韓国でチャージ", "ツヤ肌の正解、\n水光注射", "素肌から発光、\n水分たっぷり"],
      subs: ["水光注射 スペシャルケア", "ツヤ・弾力 同時ケア", "時短うるおいプログラム"],
      captionLead: [
        "旅行中でも受けられる時短ケアで、ツヤ肌をお持ち帰り✨",
        "乾燥・くすみが気になる方へ。内側からぷるんとうるおい肌に💧",
        "撮影・イベント前の駆け込みケアにも◎ 即日ツヤ肌へ✨",
      ],
      captionTrust: [
        "日本語スタッフ常駐で安心🇯🇵 来院前にLINEで無料相談OK💬",
        "カウンセリングから施術まで日本語対応。当日予約も歓迎です。",
      ],
      hashtags: ["#水光注射", "#韓国美容", "#ツヤ肌", "#美肌", "#韓国旅行", "#うるおい"],
    },
    CN: {
      headlines: ["韩国水光针，\n素颜也发光", "水光养肤，\n由内透光", "补水提亮，\n水光针护理"],
      subs: ["热门 水光护理", "光泽 + 弹力 同步", "快速补水方案"],
      captionLead: [
        "旅行途中也能做的快速护理，带走满满水光肌✨",
        "干燥暗沉肌看过来，由内而外的水润光泽💧",
      ],
      captionTrust: ["中文客服全程陪同🇨🇳 来韩前加微信免费咨询💬", "面诊到护理全程中文对接，当天预约也欢迎。"],
      hashtags: ["#水光针", "#韩国美容", "#素颜肌", "#补水", "#韩国旅行", "#提亮"],
    },
  },
  리프팅: {
    JP: {
      headlines: ["たるみ知らずの\nVライン", "キュッと引き上げ、\n小顔リフト", "自然な引き上げ、\nノーダウンタイム"],
      subs: ["高密度リフティング", "小顔デザインプログラム", "ダウンタイム少なめ施術"],
      captionLead: [
        "1回でキュッと引き上げ。フェイスラインをすっきり小顔に✨",
        "観光の合間に🕊 ダウンタイムほぼなしで引き上げケア。",
      ],
      captionTrust: ["日本語カウンセリングで丁寧にご提案。LINE無料相談OK💬", "実績多数のクリニックで安心施術。"],
      hashtags: ["#リフティング", "#小顔", "#Vライン", "#韓国美容", "#糸リフト", "#たるみ改善"],
    },
    CN: {
      headlines: ["紧致V脸，\n一次见效", "提升紧致，\n打造小脸", "自然提升，\n恢复期超短"],
      subs: ["高密度 提升项目", "小脸轮廓设计", "微恢复期方案"],
      captionLead: ["一次紧致提升，轮廓更清晰小脸✨", "旅行途中也能做，几乎无恢复期的提升护理。"],
      captionTrust: ["中文一对一咨询，来韩前免费评估面部💬", "口碑机构安心护理。"],
      hashtags: ["#韩国提升", "#V脸", "#小脸", "#韩国医美", "#线雕", "#紧致"],
    },
  },
  보톡스: {
    JP: {
      headlines: ["自然な若見え、\nシワ・エラに", "気になる所だけ、\nピンポイント", "ナチュラル小顔、\nボトックス"],
      subs: ["ボトックス お試しプラン", "部位別デザイン", "若見えケア"],
      captionLead: ["エラ・額・目尻、気になる所だけピンポイントで✨", "自然な仕上がりにこだわったボトックスデザイン。"],
      captionTrust: ["実績クリニックで安心施術。日本語カウンセリングOK💬", "初めての方も丁寧にご案内します。"],
      hashtags: ["#ボトックス", "#エラボトックス", "#若見え", "#韓国美容", "#小顔", "#シワ改善"],
    },
    CN: {
      headlines: ["自然瘦脸，\n抚平细纹", "只打需要的，\n精准设计", "自然小脸，\n肉毒护理"],
      subs: ["肉毒 体验方案", "分部位设计", "童颜护理"],
      captionLead: ["咬肌、额头、眼角，只针对在意的部位✨", "追求自然效果的肉毒设计。"],
      captionTrust: ["口碑机构安心护理，中文咨询💬", "新手也会细心引导。"],
      hashtags: ["#肉毒", "#瘦脸针", "#童颜", "#韩国美容", "#小脸", "#除皱"],
    },
  },
  필러: {
    JP: {
      headlines: ["横顔美人、\nヒアルロン酸で", "立体感デザイン、\nフィラー", "自然なボリューム、\n横顔に自信"],
      subs: ["フィラー 立体感デザイン", "バランス設計", "ナチュラルボリューム"],
      captionLead: ["鼻・唇・あごのバランスを自然にデザイン💉", "横顔の立体感をさりげなくアップ。"],
      captionTrust: ["日本語OKのフィラー専門カウンセリング💬", "デザイン重視で丁寧にご提案。"],
      hashtags: ["#フィラー", "#ヒアルロン酸", "#横顔美人", "#韓国美容", "#立体感", "#韓国整形"],
    },
    CN: {
      headlines: ["侧颜美人，\n玻尿酸塑形", "立体设计，\n玻尿酸填充", "自然饱满，\n侧颜更精致"],
      subs: ["玻尿酸 立体设计", "比例设计", "自然饱满"],
      captionLead: ["鼻、唇、下巴比例自然设计💉", "悄悄提升侧颜立体感。"],
      captionTrust: ["中文玻尿酸专业咨询💬", "注重设计，细致建议。"],
      hashtags: ["#玻尿酸", "#侧颜美人", "#填充", "#韩国医美", "#立体感", "#韩国整形"],
    },
  },
  미백토닝: {
    JP: {
      headlines: ["くすみオフで\nワントーン上の肌", "色白透明感、\nトーニング", "シミ・くすみ、\n集中ケア"],
      subs: ["美白トーニング 集中ケア", "透明感プログラム", "シミケア"],
      captionLead: ["色ムラ・くすみをケアして透明感アップ🤍", "シミ・そばかすが気になる方へ。"],
      captionTrust: ["観光のついでに寄れる立地。日本語対応OK💬", "回数券でお得に続けられます。"],
      hashtags: ["#美白", "#トーニング", "#透明感", "#韓国スキンケア", "#シミケア", "#韓国美容"],
    },
    CN: {
      headlines: ["告别暗沉，\n肤色提亮一度", "白皙透亮，\n激光调理", "淡斑提亮，\n集中护理"],
      subs: ["美白调理 集中护理", "透亮方案", "淡斑护理"],
      captionLead: ["改善肤色不均与暗沉，提升透亮感🤍", "在意斑点的姐妹看过来。"],
      captionTrust: ["位置便利，顺路就能做，中文对接💬", "套餐更划算。"],
      hashtags: ["#美白", "#调理", "#透亮", "#韩国护肤", "#淡斑", "#韩国美容"],
    },
  },
  모공여드름: {
    JP: {
      headlines: ["毛穴レス肌、\n本気ケア", "ニキビ跡まで、\nまとめてケア", "ツルツル素肌、\n毛穴・ニキビ"],
      subs: ["毛穴・ニキビ 集中プログラム", "トラブル集中ケア", "ツルツル肌プログラム"],
      captionLead: ["ニキビ跡・黒ずみをまとめてケア🌿", "毛穴の開き・ざらつきが気になる方へ。"],
      captionTrust: ["学割あり🎓 日本語カウンセリングOK💬", "肌状態に合わせて丁寧にご提案。"],
      hashtags: ["#毛穴ケア", "#ニキビ", "#ツルツル肌", "#韓国美容", "#肌荒れ", "#毛穴レス"],
    },
    CN: {
      headlines: ["毛孔细致，\n认真护理", "连痘印一起，\n打包护理", "光滑素肌，\n毛孔痘痘"],
      subs: ["毛孔·痘痘 集中方案", "肌肤问题护理", "光滑肌方案"],
      captionLead: ["痘印、黑头一起护理🌿", "毛孔粗大、粗糙的姐妹看过来。"],
      captionTrust: ["学生优惠🎓 中文咨询💬", "根据肤况细致建议。"],
      hashtags: ["#毛孔护理", "#祛痘", "#光滑肌", "#韩国美容", "#痘印", "#细致毛孔"],
    },
  },
  스킨부스터: {
    JP: {
      headlines: ["内側から発光、\nうるおい貯金", "ぷるん素肌、\nスキンブースター", "乾燥肌に、\nうるおいチャージ"],
      subs: ["スキンブースター 水分チャージ", "うるおいブースト", "弾力ケア"],
      captionLead: ["ヒアルロン酸ブースターで内側からぷるん🌷", "乾燥・小じわが気になる方に。"],
      captionTrust: ["おしゃれクリニックで日本語対応💬", "肌質に合わせてご提案します。"],
      hashtags: ["#スキンブースター", "#うるおい", "#乾燥肌", "#韓国美容", "#弾力", "#美肌"],
    },
    CN: {
      headlines: ["由内发光，\n水润储备", "弹润素肌，\n肤质护理", "干燥肌，\n补水充电"],
      subs: ["水光肤质 补水方案", "水润提升", "弹力护理"],
      captionLead: ["玻尿酸护理由内而外水润🌷", "干燥、细纹困扰看过来。"],
      captionTrust: ["氛围感机构，中文对接💬", "根据肤质给建议。"],
      hashtags: ["#肤质护理", "#补水", "#干燥肌", "#韩国美容", "#弹力", "#美肌"],
    },
  },
};

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

export function generateCreative(
  reference: Ad,
  req: GenerateRequest
): GeneratedCreative {
  const seed = req.seed ?? 0;
  // 카피 뱅크는 JP/CN 만 보유 — 그 외(KR 등)는 JP 로 폴백
  const lang: Lang = req.lang === "CN" ? "CN" : "JP";
  const bank = BANK[reference.treatment][lang];
  const tl = TREATMENT_LABEL[reference.treatment];

  const headline = pick(bank.headlines, seed);
  const sub = pick(bank.subs, seed + 1);
  const caption = `${pick(bank.captionLead, seed)} ${pick(
    bank.captionTrust,
    seed + 2
  )}`;

  // 해시태그: 시술 뱅크 + 우리 클리닉/지역 태그를 섞어 5개
  const areaTag =
    lang === "JP" ? `#${req.area ?? reference.area}皮膚科` : `#${req.area ?? reference.area}皮肤科`;
  const hashtags = [...bank.hashtags];
  // seed 에 따라 회전시켜 변형
  const rotated = hashtags
    .slice(seed % hashtags.length)
    .concat(hashtags.slice(0, seed % hashtags.length));
  const finalTags = Array.from(new Set([areaTag, ...rotated])).slice(0, 5);

  // 레퍼런스에서 차용한 특징(인사이트)
  const borrowedFrom = [
    `'${reference.clinic}'의 ${STYLE_TEXT(reference.style)} 스타일`,
    `${tl.ko} 시술 핵심 메시지`,
    `반응 좋은 ${lang === "JP" ? "일본어" : "중국어"} 카피 톤`,
    `컬러 무드(${reference.palette[0]} → ${reference.palette[1]})`,
  ];

  const imagePrompt = buildImagePrompt(reference, req.clinicName, lang);

  return {
    clinicName: req.clinicName,
    treatmentKo: tl.ko,
    treatmentLabel: lang === "JP" ? tl.jp : tl.ko,
    lang,
    headline,
    sub,
    caption,
    hashtags: finalTags,
    palette: reference.palette,
    style: reference.style,
    borrowedFrom,
    imagePrompt,
    seed,
  };
}

function STYLE_TEXT(style: string): string {
  return style;
}

// 실제 이미지 생성 API 연동 시 사용할 프롬프트 (지금은 미리보기/문서용)
function buildImagePrompt(ref: Ad, clinic: string, lang: Lang): string {
  const tl = TREATMENT_LABEL[ref.treatment];
  const audience = lang === "JP" ? "Japanese female tourists" : "Chinese female tourists";
  return [
    `Instagram square ad creative for a Korean dermatology clinic "${clinic}".`,
    `Treatment: ${tl.jp} (${tl.ko}).`,
    `Target audience: ${audience} visiting Seoul (${ref.area}).`,
    `Style: clean, premium K-beauty, soft gradient background ${ref.palette[0]} to ${ref.palette[1]}, glowing healthy skin, minimal layout, modern sans-serif headline, lots of negative space.`,
    `Mood: ${ref.style}. High-end, trustworthy, bright.`,
  ].join(" ");
}
