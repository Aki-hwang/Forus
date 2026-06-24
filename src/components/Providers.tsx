"use client";

// 클라이언트 컴포넌트용 컨텍스트: 세션 + UI 언어(i18n).
import { SessionProvider } from "next-auth/react";
import { LangProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LangProvider>{children}</LangProvider>
    </SessionProvider>
  );
}
