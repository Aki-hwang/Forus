"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

type Provider = "google" | "naver";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "이미 다른 방식으로 가입된 이메일이에요. 처음 사용한 로그인 방식으로 다시 시도해 주세요.",
  AccessDenied: "로그인이 취소되었거나 권한이 거부되었어요.",
  Configuration:
    "로그인 설정에 문제가 있어요. 잠시 후 다시 시도해 주세요. (관리자: OAuth 환경변수를 확인하세요)",
  default: "로그인 중 문제가 발생했어요. 다시 시도해 주세요.",
};

function LoginCard() {
  const params = useSearchParams();
  const { status } = useSession();
  const [loading, setLoading] = useState<Provider | null>(null);

  const errorCode = params.get("error");
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.default
    : null;

  function handleSignIn(provider: Provider) {
    setLoading(provider);
    // 소셜 인증 후 홈으로 복귀. (첫 로그인 시 계정이 자동 생성됩니다.)
    signIn(provider, { callbackUrl: "/" });
  }

  return (
    <div className="animate-fadeup w-full max-w-sm rounded-3xl border border-border bg-surface p-7 shadow-2xl">
      {/* 로고 */}
      <Link href="/" className="mx-auto flex w-fit items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-black text-white shadow-sm">
          D
        </div>
        <span className="text-[18px] font-black tracking-tight text-foreground">
          DermaRadar
        </span>
      </Link>

      <h1 className="mt-5 text-center text-[20px] font-black tracking-tight text-foreground">
        로그인 / 회원가입
      </h1>
      <p className="mt-1.5 text-center text-[13px] leading-relaxed text-muted">
        소셜 계정으로 3초 만에 시작하세요.
        <br />
        처음이면 자동으로 회원가입됩니다.
      </p>

      {status === "authenticated" ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center text-[13px] text-primary-ink">
          이미 로그인되어 있어요.
          <Link href="/" className="ml-1 font-bold underline">
            홈으로 가기 →
          </Link>
        </div>
      ) : (
        <>
          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {/* Google */}
            <button
              onClick={() => handleSignIn("google")}
              disabled={loading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white py-3 text-[14px] font-bold text-foreground shadow-sm transition hover:bg-background disabled:opacity-60"
            >
              {loading === "google" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
              ) : (
                <GoogleIcon />
              )}
              Google로 계속하기
            </button>

            {/* Naver */}
            <button
              onClick={() => handleSignIn("naver")}
              disabled={loading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#03C75A] py-3 text-[14px] font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {loading === "naver" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <NaverIcon />
              )}
              네이버로 계속하기
            </button>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
        계속 진행하면 DermaRadar의 서비스 약관과
        <br />
        개인정보 처리방침에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Suspense
        fallback={
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        }
      >
        <LoginCard />
      </Suspense>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg className="h-[15px] w-[15px]" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.56 10.7 6.16 0H0v20h6.44V9.3l7.4 10.7H20V0h-6.44z"
      />
    </svg>
  );
}
