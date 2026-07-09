"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LangSwitcher } from "./LangSwitcher";
import { useUiLang } from "@/lib/i18n";

export function Header({ onReset }: { onReset?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { lang, t } = useUiLang();
  // 소비자 가이드: UI 언어에 맞는 버전으로 연결 (한국어 → /ko, 그 외 → /jp)
  const guideHref = lang === "ko" ? "/ko" : "/jp";
  // 주간 레이더: UI 언어별 로케일 매핑 (가이드와 달리 4개 로케일 모두 존재)
  const weeklyHref =
    lang === "ko" ? "/ko/weekly" : lang === "zh" ? "/tw/weekly" : lang === "en" ? "/en/weekly" : "/jp/weekly";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-5">
        <Link
          href="/"
          // 이미 홈이면 라우팅 대신 맨 위로 스크롤 + 필터/선택 초기화
          onClick={(e) => {
            if (onReset && pathname === "/") {
              e.preventDefault();
              onReset();
            }
          }}
          className="flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="DermaRadar" className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-[20px] font-black tracking-tight text-foreground sm:text-[24px]">
              DermaRadar
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 주간 레이더 리포트 — 모바일은 📡 아이콘만(헤더 폭 절약), sm 이상 텍스트 표시 */}
          <Link
            href={weeklyHref}
            title={t("weeklyRadar")}
            className="whitespace-nowrap rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[12px] font-bold text-primary-ink transition hover:bg-primary/10 sm:px-3.5 sm:text-[13px]"
          >
            📡<span className="hidden sm:inline"> {t("weeklyRadar")}</span>
          </Link>
          {/* 모바일에서도 항상 표시 — 소비자 가이드는 핵심 진입점이라 숨기지 않는다 */}
          <Link
            href={guideHref}
            className="whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-bold text-foreground transition hover:bg-background sm:px-3.5 sm:text-[13px]"
          >
            {t("consumerGuide")}
          </Link>
          <LangSwitcher />
          {/* 병원 등록·문의 CTA 는 푸터로 이동(헤더 정리) — page.tsx footer 참고 */}

          {session?.user ? (
            <UserMenu
              name={session.user.name ?? "회원"}
              image={session.user.image ?? null}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function UserMenu({ name, image }: { name: string; image: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-2.5 transition hover:bg-surface"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} image={image} />
        <span className="hidden max-w-[120px] truncate text-[13px] font-bold text-foreground sm:inline">
          {name}
        </span>
      </button>

      {open ? (
        <>
          {/* 바깥 클릭 시 닫기 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-fadeup absolute right-0 top-[calc(100%+8px)] z-20 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            <div className="border-b border-border px-3.5 py-3">
              <p className="text-[11px] text-muted">로그인됨</p>
              <p className="truncate text-[13px] font-bold text-foreground">
                {name}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground transition hover:bg-background"
            >
              로그아웃
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      // 외부 프로필 이미지(Google). next/image 도메인 설정 없이 일반 <img> 사용.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className="h-7 w-7 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[12px] font-black text-white">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
