"use client";

// 사이트 UI 다국어(i18n). 콘텐츠(캡션 등)는 원문 유지, 인터페이스 문구만 번역.
import { createContext, useContext, useEffect, useState } from "react";
import { TREATMENT_LABEL, type TreatmentKey } from "@/lib/ads";

export type UiLang = "ko" | "ja" | "zh" | "en";

export const UI_LANGS: { code: UiLang; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
];

type Str = Record<UiLang, string>;
const S = (ko: string, ja: string, zh: string, en: string): Str => ({ ko, ja, zh, en });

const STRINGS: Record<string, Str> = {
  // 헤더
  // 소비자 가이드 링크 — UI 언어에 따라 라벨·목적지(/ko·/jp)가 바뀐다 (Header 참고)
  consumerGuide: S("피부과 여행 가이드", "🇯🇵 旅行者ガイド", "🇯🇵 旅行者指南", "🇯🇵 Visitor guide"),
  register: S("인스타그램 등록", "Instagram登録", "Instagram登记", "Register Instagram"),
  registerShort: S("인스타 등록", "登録", "登记", "Register"),
  inquiry: S("문의하기", "お問い合わせ", "咨询", "Contact"),
  admin: S("관리자", "管理者", "管理员", "Admin"),
  adminExit: S("관리자 모드 종료", "管理者モード終了", "退出管理员", "Exit admin"),
  adminEnterTitle: S("관리자 진입", "管理者ログイン", "管理员登录", "Admin access"),
  adminEnterDesc: S("관리자 키를 입력하세요.", "管理者キーを入力してください。", "请输入管理员密钥。", "Enter the admin key."),
  adminKeyPh: S("관리자 키", "管理者キー", "管理员密钥", "Admin key"),
  cancel: S("취소", "キャンセル", "取消", "Cancel"),
  enterBtn: S("진입", "ログイン", "进入", "Enter"),
  // 타이틀
  titlePre: S(
    "강남·명동·홍대 피부과 마케팅 트렌드를 ",
    "江南·明洞·弘大の皮膚科マーケティングトレンドを",
    "江南·明洞·弘大皮肤科营销趋势，",
    "Derma marketing trends in Gangnam·Myeongdong·Hongdae "
  ),
  titleHi: S("한눈에", "ひと目で", "一目了然", "at a glance"),
  // 공통/필터
  all: S("전체", "すべて", "全部", "All"),
  paid: S("유료", "有料", "付费", "Paid"),
  free: S("무료", "無料", "免费", "Free"),
  // 광고주 유형 필터·배지 (구 유료/무료 필터 대체 — 유료/무료는 카드 칩으로만 표시)
  clinicTab: S("병원", "クリニック", "医院", "Clinics"),
  influencer: S("시술후기", "施術レビュー", "体验分享", "Reviews"),
  sortTrending: S("인기", "人気", "热门", "Trending"),
  sortRecent: S("최신순", "新着順", "最新", "Latest"),
  sortViews: S("조회수순", "再生数順", "播放量", "Views"),
  sortFollowers: S("팔로워순", "フォロワー順", "粉丝数", "Followers"),
  totalCount: S("총 {n}건", "計 {n}件", "共 {n} 条", "{n} total"),
  // 콘텐츠 언어 탭(필터)
  langKo: S("한국어", "韓国語", "韩语", "Korean"),
  langJa: S("일본어", "日本語", "日语", "Japanese"),
  langZh: S("중국어", "中国語", "中文", "Chinese"),
  langEn: S("영어", "英語", "英语", "English"),
  // 트렌드 패널
  regionDist: S("지역별 광고 분포", "地域別の広告分布", "各地区广告分布", "Ads by area"),
  popKeywords: S("인기 키워드", "人気キーワード", "热门关键词", "Top keywords"),
  more: S("더보기", "もっと見る", "查看更多", "More"),
  topClinics: S("조회수 TOP 클리닉 (7일)", "再生数TOPクリニック(7日)", "播放量TOP诊所(7天)", "Top clinics (7d)"),
  topReviewers: S("조회수 TOP 후기계정 (7일)", "再生数TOPレビュー(7日)", "播放量TOP分享(7天)", "Top reviewers (7d)"),
  topPosts: S("조회수 TOP 게시물 (7일)", "再生数TOP投稿(7日)", "播放量TOP帖子(7天)", "Top posts (7d)"),
  popTreatments: S("인기 시술 (7일)", "人気施術(7日)", "热门项目(7天)", "Top treatments (7d)"),
  contentTypes: S("콘텐츠 유형 (7일)", "コンテンツ種類(7日)", "内容类型(7天)", "Content types (7d)"),
  statCollected: S("수집된 광고", "収集した広告", "已收集广告", "Ads collected"),
  statNew: S("🆕 신규 광고", "🆕 新規広告", "🆕 新增广告", "🆕 New ads"),
  statTop: S("🔥 최다 조회(7일)", "🔥 最多再生(7日)", "🔥 最高播放(7天)", "🔥 Top views (7d)"),
  hintNew7: S("최근 7일 시작", "直近7日に開始", "近7天新增", "Started in last 7 days"),
  hintRegions: S("강남·명동·홍대", "江南·明洞·弘大", "江南·明洞·弘大", "Gangnam·Myeongdong·Hongdae"),
  collectedSuffix: S("수집", "収集", "收集", "collected"),
  emptyPeriodAds: S("이 기간에 집행된 광고가 없어요.", "この期間の広告はありません。", "该时段没有广告。", "No ads in this period."),
  emptyPosts: S("최근 7일 게시물이 없어요.", "直近7日の投稿はありません。", "近7天没有帖子。", "No posts in the last 7 days."),
  emptyTreatments: S("분류된 시술이 없어요.", "分類された施術がありません。", "暂无分类项目。", "No treatments."),
  emptyContent: S("분류된 콘텐츠가 없어요.", "分類されたコンテンツがありません。", "暂无分类内容。", "No content."),
  noKeyword: S("키워드 없음", "キーワードなし", "无关键词", "No keywords"),
  kwModalTitle: S("인기 키워드 전체", "人気キーワード全体", "全部热门关键词", "All top keywords"),
  countSuffix: S("개", "件", "个", ""),
  unit: S("건", "件", "条", ""),
  // 상세 모달
  viewPost: S("↗ 이 게시물 보기", "↗ この投稿を見る", "↗ 查看该帖子", "↗ View post"),
  viewAccount: S("인스타그램 (@{h}) 보기", "Instagram (@{h}) を見る", "查看 Instagram (@{h})", "View Instagram (@{h})"),
  viewsUnit: S("조회", "再生", "播放", "views"),
  activeDaysRan: S("{n}일 집행", "{n}日配信", "已投放 {n} 天", "running {n}d"),
  // 갤러리 빈 상태·무한스크롤
  emptyFiltered: S("조건에 맞는 게시물이 없어요.", "条件に合う投稿がありません。", "没有符合条件的帖子。", "No posts match the filters."),
  resetFilters: S("필터 초기화", "フィルターをリセット", "重置筛选", "Reset filters"),
  scrollMore: S("{shown}/{total} — 스크롤하면 더 보여요", "{shown}/{total} — スクロールでさらに表示", "{shown}/{total} — 滚动查看更多", "{shown}/{total} — scroll for more"),
  // 트렌드 패널 모바일 접기
  trendMore: S("트렌드 지표 더보기", "トレンド指標をもっと見る", "查看更多趋势指标", "More trend metrics"),
  trendLess: S("트렌드 지표 접기", "トレンド指標をたたむ", "收起趋势指标", "Hide trend metrics"),
  // 카드
  detailView: S("상세 보기", "詳細を見る", "查看详情", "View details"),
  exclude: S("제외", "除外", "排除", "Exclude"),
  block: S("🚫 차단", "🚫 ブロック", "🚫 屏蔽", "🚫 Block"),
  registered: S("⭐ 등록", "⭐ 登録", "⭐ 登记", "⭐ Listed"),
  dayUnit: S("일", "日", "天", "d"),
  advToReview: S("→후기", "→レビュー", "→分享", "→Review"),
  advToClinic: S("→병원", "→医院", "→医院", "→Clinic"),
  advToggleTip: S("광고주 유형 전환 (병원↔시술후기) — 이 계정의 모든 게시물에 적용, 영구 저장", "広告主タイプ切替（医院↔レビュー）— このアカウント全体に適用・永続保存", "切换广告主类型（医院↔分享）— 应用于该账号全部帖子并永久保存", "Toggle advertiser type (clinic↔review) — applies to this account, saved permanently"),
  excludeTip: S("이 게시물만 이번 수집에서 제외 (다음 수집 때 다시 보임)", "今回の収集からこの投稿のみ除外（次回再表示）", "仅本次收集排除该帖（下次会再出现）", "Exclude this post this collection (returns next collection)"),
  blockTip: S("이 계정 자체를 차단 (재수집해도 안 보임)", "このアカウントをブロック（再収集後も非表示）", "屏蔽该账号（重新收集也不显示）", "Block this account (stays hidden after re-collection)"),
  // 등록 모달
  regTitle: S("인스타그램 등록", "Instagram登録", "Instagram登记", "Register Instagram"),
  regSub: S("등록되면 트렌드 대시보드에 우리 병원 게시물이 함께 수집돼요.", "登録するとトレンドにあなたのクリニックの投稿も収集されます。", "登记后，您诊所的帖子也会被收集到趋势中。", "Once listed, your clinic's posts are included in the dashboard."),
  fName: S("병원명", "クリニック名", "诊所名称", "Clinic name"),
  fNamePh: S("예: 유앤아이의원", "例: ○○クリニック", "例: ○○诊所", "e.g. YOU&I Clinic"),
  fIg: S("인스타그램 핸들 / URL", "Instagramハンドル / URL", "Instagram账号 / URL", "Instagram handle / URL"),
  fIgPh: S("@clinic_official 또는 https://instagram.com/...", "@clinic_official または https://instagram.com/...", "@clinic_official 或 https://instagram.com/...", "@clinic_official or https://instagram.com/..."),
  fArea: S("지역", "地域", "地区", "Area"),
  optional: S("(선택)", "（任意）", "（选填）", "(optional)"),
  fContact: S("연락처", "連絡先", "联系方式", "Contact"),
  fContactPh: S("이메일 또는 전화번호", "メールまたは電話番号", "邮箱或电话", "Email or phone"),
  fOneLine: S("한마디", "ひとこと", "留言", "Message"),
  fOneLinePh: S("요청 사항이 있다면 적어주세요.", "ご要望があればご記入ください。", "如有需求请填写。", "Any requests?"),
  regSend: S("등록 요청 보내기", "登録をリクエスト", "提交登记", "Submit registration"),
  sending: S("제출 중…", "送信中…", "提交中…", "Sending…"),
  regDoneTitle: S("요청이 접수됐어요!", "リクエストを受け付けました！", "已收到您的申请！", "Request received!"),
  regDoneDesc: S("검토 후 다음 수집 때 반영해 드릴게요. 감사합니다.", "確認後、次回の収集で反映します。ありがとうございます。", "审核后将于下次收集时反映。谢谢！", "We'll include it after review. Thank you!"),
  close: S("닫기", "閉じる", "关闭", "Close"),
  errReqReg: S("병원명과 인스타그램은 필수예요.", "クリニック名とInstagramは必須です。", "诊所名称和Instagram为必填。", "Clinic name and Instagram are required."),
  regPrivacy: S("제출하신 정보는 등록 검토 용도로만 사용돼요.", "ご記入情報は登録審査のみに使用します。", "所填信息仅用于登记审核。", "Your info is used only for registration review."),
  // 문의 모달
  inqTitle: S("문의하기", "お問い合わせ", "咨询", "Contact"),
  inqSub: S("궁금한 점·제휴·피드백을 남겨주세요.", "ご質問・提携・ご意見をどうぞ。", "欢迎留下问题·合作·反馈。", "Questions, partnerships, or feedback."),
  inqNamePh: S("예: 홍길동 / OO의원", "例: 山田 / ○○クリニック", "例: 张三 / ○○诊所", "e.g. John / Clinic name"),
  inqMsg: S("문의 내용", "お問い合わせ内容", "咨询内容", "Message"),
  inqMsgPh: S("내용을 입력하세요.", "内容をご記入ください。", "请输入内容。", "Type your message."),
  inqSend: S("문의 보내기", "送信する", "发送咨询", "Send"),
  inqDoneTitle: S("문의가 접수됐어요!", "お問い合わせを受け付けました！", "已收到您的咨询！", "Message sent!"),
  inqDoneDesc: S("남겨주신 연락처로 회신드릴게요. 감사합니다.", "ご連絡先へ返信いたします。ありがとうございます。", "我们会通过您的联系方式回复。谢谢！", "We'll get back to you. Thank you!"),
  errReqInq: S("이름, 연락처, 문의 내용을 모두 입력해 주세요.", "お名前・連絡先・お問い合わせ内容をすべてご入力ください。", "请填写姓名、联系方式和咨询内容。", "Please fill in name, contact, and message."),
};

const AREA: Record<string, Str> = {
  "강남": S("강남", "江南", "江南", "Gangnam"),
  "명동": S("명동", "明洞", "明洞", "Myeongdong"),
  "홍대": S("홍대", "弘大", "弘大", "Hongdae"),
  "기타": S("기타", "その他", "其他", "Other"),
};

const CONTENT_TYPE: Record<string, Str> = {
  "이벤트·할인": S("이벤트·할인", "イベント・割引", "活动·优惠", "Event·Deal"),
  "비포애프터": S("비포애프터", "ビフォーアフター", "前后对比", "Before·After"),
  "후기·리뷰": S("후기·리뷰", "口コミ・レビュー", "评价·点评", "Reviews"),
  "시술정보": S("시술정보", "施術情報", "项目信息", "Treatment info"),
  "브랜딩": S("브랜딩", "ブランディング", "品牌", "Branding"),
};

const LangCtx = createContext<{
  lang: UiLang;
  setLang: (l: UiLang) => void;
  t: (k: keyof typeof STRINGS, vars?: Record<string, string | number>) => string;
  tArea: (a: string) => string;
  tContentType: (c: string) => string;
  tTreatment: (k: string) => string;
  tClinic: (clinic: string, handle?: string) => string;
}>({
  lang: "ko",
  setLang: () => {},
  t: (k) => String(k),
  tArea: (a) => a,
  tContentType: (c) => c,
  tTreatment: (k) => k,
  tClinic: (clinic) => clinic,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UiLang>("ko");
  useEffect(() => {
    const s = (typeof localStorage !== "undefined" && localStorage.getItem("uiLang")) as UiLang | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (s && ["ko", "ja", "zh", "en"].includes(s)) setLangState(s);
  }, []);
  const setLang = (l: UiLang) => {
    setLangState(l);
    try {
      localStorage.setItem("uiLang", l);
    } catch {
      /* ignore */
    }
  };
  const t = (k: keyof typeof STRINGS, vars?: Record<string, string | number>) => {
    let s = STRINGS[k]?.[lang] ?? STRINGS[k]?.ko ?? String(k);
    if (vars) for (const [vk, vv] of Object.entries(vars)) s = s.replace(`{${vk}}`, String(vv));
    return s;
  };
  const tArea = (a: string) => AREA[a]?.[lang] ?? a;
  const tContentType = (c: string) => CONTENT_TYPE[c]?.[lang] ?? c;
  const TFIELD: Record<UiLang, "ko" | "jp" | "zh" | "en"> = { ko: "ko", ja: "jp", zh: "zh", en: "en" };
  const tTreatment = (k: string) => TREATMENT_LABEL[k as TreatmentKey]?.[TFIELD[lang]] ?? k;
  // 비한국어 UI: 병원명(고유명사) 대신 인스타 핸들 표시
  const tClinic = (clinic: string, handle?: string) =>
    lang !== "ko" && handle ? handle : (clinic ?? "").replace(/\s*\(.*\)$/, "");
  return (
    <LangCtx.Provider value={{ lang, setLang, t, tArea, tContentType, tTreatment, tClinic }}>{children}</LangCtx.Provider>
  );
}

export const useUiLang = () => useContext(LangCtx);
