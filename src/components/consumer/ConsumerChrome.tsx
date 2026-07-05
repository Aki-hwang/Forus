// 소비자 페이지(/jp·/ko) 공통 헤더·푸터 — 서버 컴포넌트.
// 대시보드 Header(클라이언트·세션 의존)와 분리해 소비자 페이지는 JS 없이 가볍게 유지.

import Link from "next/link";
import { ConsumerLocale, CONSUMER_UI } from "@/lib/consumer";
import { TopLink } from "./TopLink";

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
          {/* 대시보드 헤더와 통일 — 같은 크기, 부제('피부과 시술 가이드')는 제거 */}
          <p className="text-[20px] font-black tracking-tight text-foreground sm:text-[24px]">
            DermaRadar
          </p>
        </Link>
        {/* 시술/지역 메뉴는 섹션 앵커(#treatments·#areas) 대신 가이드 홈 맨 위로 —
            앵커 점프(특히 지역 섹션은 페이지 중간)가 새로고침처럼 상단으로 가길 기대하는
            사용자에게 어색해서. 두 섹션 모두 첫 화면 바로 아래라 접근성은 동일. */}
        <nav className="flex items-center gap-2 text-[12.5px] font-bold">
          <TopLink
            href={`/${locale}`}
            className="rounded-lg px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            {ui.navTreatments}
          </TopLink>
          <TopLink
            href={`/${locale}`}
            className="rounded-lg px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            {ui.navAreas}
          </TopLink>
          <Link
            href={`/${other.locale}`}
            className="rounded-lg border border-border px-2.5 py-1.5 text-muted transition hover:text-foreground"
          >
            {other.label}
          </Link>
          {/* 대시보드(홈) — 텍스트 대신 홈 아이콘 (아이콘이라 모바일에서도 표시 가능) */}
          <Link
            href="/"
            title={ui.navOwner}
            aria-label={ui.navOwner}
            className="rounded-lg border border-border px-2.5 py-1.5 text-muted transition hover:text-foreground"
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
