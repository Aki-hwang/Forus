// 소비자 페이지(/jp·/ko) 공통 헤더·푸터 — 서버 컴포넌트.
// 대시보드 Header(클라이언트·세션 의존)와 분리해 소비자 페이지는 JS 없이 가볍게 유지.

import Link from "next/link";
import { ConsumerLocale, CONSUMER_UI } from "@/lib/consumer";
import { SectionLink } from "./SectionLink";

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
        <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="DermaRadar" className="h-6 w-6 sm:h-7 sm:w-7" />
          {/* 대시보드 헤더와 통일 — 같은 크기, 부제('피부과 시술 가이드')는 제거 */}
          <p className="text-[18px] font-black tracking-tight text-foreground sm:text-[24px]">
            DermaRadar
          </p>
        </Link>
        {/* 시술로/지역으로 찾기 → 해당 섹션으로 "부드럽게" 스크롤(SectionLink).
            같은 랜딩이면 smooth scroll(scroll-mt-20 이 sticky 헤더 보정), 하위 페이지면 랜딩+해시로 이동.
            모바일: 한 줄 유지(nowrap)+가로 스와이프, 데스크톱은 대시보드 버튼과 같은 13px. */}
        <nav className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto text-[12px] font-bold sm:gap-2 sm:text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SectionLink
            base={`/${locale}`}
            hash="treatments"
            className="shrink-0 whitespace-nowrap rounded-lg px-2 py-1.5 text-muted transition hover:text-foreground sm:px-3 sm:py-2"
          >
            {ui.navTreatments}
          </SectionLink>
          <SectionLink
            base={`/${locale}`}
            hash="areas"
            className="shrink-0 whitespace-nowrap rounded-lg px-2 py-1.5 text-muted transition hover:text-foreground sm:px-3 sm:py-2"
          >
            {ui.navAreas}
          </SectionLink>
          <Link
            href={`/${other.locale}`}
            className="shrink-0 whitespace-nowrap rounded-lg border border-border px-2 py-1.5 text-muted transition hover:text-foreground sm:px-3 sm:py-2"
          >
            {other.label}
          </Link>
          {/* 대시보드(홈) — 텍스트 대신 홈 아이콘 (아이콘이라 모바일에서도 표시 가능) */}
          <Link
            href="/"
            title={ui.navOwner}
            aria-label={ui.navOwner}
            className="shrink-0 whitespace-nowrap rounded-lg border border-border px-2 py-1.5 text-muted transition hover:text-foreground sm:px-3 sm:py-2"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
            </svg>
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
