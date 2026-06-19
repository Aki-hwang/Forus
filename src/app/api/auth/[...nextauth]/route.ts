// Auth.js v5 핸들러를 /api/auth/* 경로에 연결합니다.
// (로그인/콜백/세션/로그아웃 엔드포인트를 모두 처리)
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
