"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { RegisterClinic } from "./RegisterClinic";

export function Header({ onReset }: { onReset?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
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
          <img src="/logo.svg" alt="DermaRadar" className="h-9 w-9" />
          <div className="leading-tight">
            <p className="text-[24px] font-black tracking-tight text-foreground">
              DermaRadar
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-muted md:inline">
            한·일·중 타겟
          </span>

          <RegisterClinic />

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
