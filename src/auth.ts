// Auth.js v5 (NextAuth) 설정 — Google / Naver 소셜 로그인, JWT 세션(DB 없음)
//
// 필요한 환경변수 (.env.local 또는 배포 환경에 설정):
//   AUTH_SECRET        — 세션 암호화 키 (`npx auth secret` 또는 `openssl rand -base64 32`)
//   AUTH_GOOGLE_ID     — Google OAuth Client ID
//   AUTH_GOOGLE_SECRET — Google OAuth Client Secret
//   AUTH_NAVER_ID      — Naver 애플리케이션 Client ID
//   AUTH_NAVER_SECRET  — Naver 애플리케이션 Client Secret
//
// 콜백(Redirect) URL — Google/Naver 개발자 콘솔에 등록할 값:
//   Google → {origin}/api/auth/callback/google
//   Naver  → {origin}/api/auth/callback/naver

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Railway 등 Vercel 외 호스팅에서 들어오는 호스트 헤더를 신뢰(AUTH_URL 자동 추론).
  trustHost: true,
  // DB 어댑터가 없으므로 세션은 암호화된 JWT 쿠키로만 관리됩니다.
  session: { strategy: "jwt" },
  providers: [
    // 환경변수 AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 를 자동으로 읽습니다.
    Google,
    // 환경변수 AUTH_NAVER_ID / AUTH_NAVER_SECRET 를 자동으로 읽습니다.
    //
    // ⚠️ Naver 주의: Naver는 토큰 응답의 `expires_in` 을 문자열로 반환하는
    //    경우가 있어 엄격한 OAuth 검증에서 OperationProcessingError 가 날 수
    //    있습니다. 실제 로그인에서 이 오류가 나면 아래처럼 token 응답을 보정하세요:
    //
    //    Naver({
    //      token: {
    //        url: "https://nid.naver.com/oauth2.0/token",
    //        conform: async (res) => {
    //          const body = await res.json();
    //          if (typeof body.expires_in === "string") {
    //            body.expires_in = Number(body.expires_in);
    //          }
    //          return new Response(JSON.stringify(body), res);
    //        },
    //      },
    //    }),
    Naver,
  ],
  pages: {
    // 기본 Auth.js 로그인 화면 대신 우리 브랜드 로그인 페이지를 사용합니다.
    signIn: "/login",
  },
});
