// Auth.js v5 (NextAuth) 설정 — Google 소셜 로그인, JWT 세션(DB 없음)
//
// 필요한 환경변수 (.env.local 또는 배포 환경에 설정):
//   AUTH_SECRET        — 세션 암호화 키 (`npx auth secret` 또는 `openssl rand -base64 32`)
//   AUTH_GOOGLE_ID     — Google OAuth Client ID
//   AUTH_GOOGLE_SECRET — Google OAuth Client Secret
//
// 배포 환경(Railway 등)에서는 AUTH_URL 을 운영 도메인으로 지정하세요.
//   예) AUTH_URL=https://forus-advertising.up.railway.app
//
// 콜백(Redirect) URL — Google 콘솔에 등록할 값:
//   Google → {origin}/api/auth/callback/google

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Railway 등 Vercel 외 호스팅 대응. 운영 도메인은 AUTH_URL 로 지정.
  trustHost: true,
  // DB 어댑터가 없으므로 세션은 암호화된 JWT 쿠키로만 관리됩니다.
  session: { strategy: "jwt" },
  providers: [
    // 환경변수 AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 를 자동으로 읽습니다.
    Google,
  ],
  pages: {
    // 기본 Auth.js 로그인 화면 대신 우리 브랜드 로그인 페이지를 사용합니다.
    signIn: "/login",
  },
});
