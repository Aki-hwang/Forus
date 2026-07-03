// 소비자 페이지(/jp·/ko) 공통 헤더·푸터 — 서버 컴포넌트.
// 대시보드 Header(클라이언트·세션 의존)와 분리해 소비자 페이지는 JS 없이 가볍게 유지.

import Link from "next/link";
import { ConsumerLocale, CONSUMER_UI } from "@/lib/consumer";

/** 반대 로케일 (헤더의 언어 전환 링크용) */
const OTHER: Record<ConsumerLocale, { locale: ConsumerLocale; label: string }> = {
  jp: { locale: "ko", label: "🇰🇷 한국어" },
  ko: { locale: "jp", label: "🇯🇵 日本語" },
};

export function ConsumerHeader({ locale }: { locale: ConsumerLocale }) {
  const ui = CONSUMER_UI[locale];
  const other = OTHER[locale];
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-5">
        {/* 로고 → 서비스 메인(대시보드). 가이드 홈은 우측 내비로 이동 */}
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="DermaRadar" className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-[19px] font-black tracking-tight text-foreground sm:text-[22px]">
              DermaRadar
            </p>
            <p className="text-[10.5px] font-bold text-muted">{ui.brandTag}</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-[12.5px] font-bold">
          <Link
            href={`/${locale}#treatments`}
            className="rounded-lg px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            {ui.navTreatments}
          </Link>
          <Link
            href={`/${locale}#areas`}
            className="rounded-lg px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            {ui.navAreas}
          </Link>
          <Link
            href={`/${other.locale}`}
            className="rounded-lg border border-border px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            {other.label}
          </Link>
          <Link
            href="/"
            className="hidden rounded-lg border border-border px-2.5 py-1.5 text-muted transition hover:text-foreground sm:block"
          >
            {ui.navOwner}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function ConsumerFooter({ locale }: { locale: ConsumerLocale }) {
  const ui = CONSUMER_UI[locale];
  return (
    <footer className="mt-12 border-t border-border py-8">
      <div className="mx-auto max-w-6xl space-y-3 px-4 text-center sm:px-5">
        <p className="mx-auto max-w-3xl text-[11.5px] leading-relaxed text-muted">
          {ui.disclaimer}
        </p>
        <p className="text-[12px] text-muted">
          DermaRadar · © Doctorstock Inc. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
