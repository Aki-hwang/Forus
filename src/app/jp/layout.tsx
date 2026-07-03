// /jp 세그먼트 레이아웃 — 일본인 여행자용. 본체는 components/consumer 공용.
// 루트 <html lang="ko">는 못 바꾸므로 세그먼트 래퍼에 lang + 폰트를 지정.

import type { Metadata } from "next";
import { CONSUMER_UI } from "@/lib/consumer";
import { ConsumerHeader, ConsumerFooter } from "@/components/consumer/ConsumerChrome";

const ui = CONSUMER_UI.jp;

export const metadata: Metadata = {
  title: { default: ui.meta.layoutTitle, template: ui.meta.layoutTemplate },
  description: ui.meta.layoutDesc,
};

export default function JpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang={ui.htmlLang} className="min-h-full font-[family-name:var(--font-jp)]">
      <ConsumerHeader locale="jp" />
      <main className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:px-5">{children}</main>
      <ConsumerFooter locale="jp" />
    </div>
  );
}
