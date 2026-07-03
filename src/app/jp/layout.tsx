// /jp 세그먼트 공통 레이아웃 — 일본인 여행자용 소비자 페이지.
// 루트 <html lang="ko">는 못 바꾸므로 세그먼트 래퍼에 lang="ja" + 일본어 폰트를 지정.

import type { Metadata } from "next";
import { JpHeader, JpFooter } from "@/components/consumer/JpChrome";

export const metadata: Metadata = {
  title: {
    default: "韓国皮膚科ガイド | DermaRadar",
    template: "%s | DermaRadar 韓国皮膚科ガイド",
  },
  description:
    "江南・明洞・弘大の皮膚科クリニックを、実際のInstagram投稿データから探せる日本人旅行者向けガイド。水光注射・リフティング・ボトックスなど人気施術ごとに紹介します。",
};

export default function JpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="ja" className="min-h-full font-[family-name:var(--font-jp)]">
      <JpHeader />
      <main className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:px-5">{children}</main>
      <JpFooter />
    </div>
  );
}
