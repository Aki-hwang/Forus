// /jp(일본인 여행자용) 공통 헤더·푸터 — 서버 컴포넌트.
// 대시보드 Header(클라이언트·세션 의존)와 분리해 소비자 페이지는 JS 없이 가볍게 유지.

import Link from "next/link";
import { CONSUMER_DISCLAIMER } from "@/lib/consumer";

export function JpHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-5">
        <Link href="/jp" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="DermaRadar" className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-[19px] font-black tracking-tight text-foreground sm:text-[22px]">
              DermaRadar
            </p>
            <p className="text-[10.5px] font-bold text-muted">韓国皮膚科ガイド</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-[12.5px] font-bold">
          <Link
            href="/jp#treatments"
            className="rounded-lg px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            施術から探す
          </Link>
          <Link
            href="/jp#areas"
            className="rounded-lg px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            エリアから探す
          </Link>
          <Link
            href="/"
            className="hidden rounded-lg border border-border px-2.5 py-1.5 text-muted transition hover:text-foreground sm:block"
          >
            クリニック運営者向け
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function JpFooter() {
  return (
    <footer className="mt-12 border-t border-border py-8">
      <div className="mx-auto max-w-6xl space-y-3 px-4 text-center sm:px-5">
        <p className="mx-auto max-w-3xl text-[11.5px] leading-relaxed text-muted">
          {CONSUMER_DISCLAIMER}
        </p>
        <p className="text-[12px] text-muted">
          DermaRadar · © Doctorstock Inc. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
