"use client";

// 클라이언트 컴포넌트에서 useSession() 을 쓸 수 있도록 세션 컨텍스트를 제공합니다.
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
