// /ko 세그먼트 레이아웃 — 한국인용 시술·이벤트 가이드. 본체는 components/consumer 공용.

import type { Metadata } from "next";
import { CONSUMER_UI } from "@/lib/consumer";
import { ConsumerHeader, ConsumerFooter } from "@/components/consumer/ConsumerChrome";

const ui = CONSUMER_UI.ko;

export const metadata: Metadata = {
  title: { default: ui.meta.layoutTitle, template: ui.meta.layoutTemplate },
  description: ui.meta.layoutDesc,
};

export default function KoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang={ui.htmlLang} className="min-h-full">
      <ConsumerHeader locale="ko" />
      <main className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:px-5">{children}</main>
      <ConsumerFooter locale="ko" />
    </div>
  );
}
