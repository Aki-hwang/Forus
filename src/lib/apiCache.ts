// 조회 API(광고·오가닉 스냅샷) 공통 — 캐시 헤더 + 리스트 페이로드 슬림화.
//
// 스냅샷은 수집(주 2회) + 드문 관리자 편집(차단/제외) 때만 바뀌므로, 짧은 브라우저 캐시 +
// stale-while-revalidate 로 "새로고침마다 전체 JSON 재다운로드"를 없앤다. 관리자 편집은
// 클라이언트가 즉시 반영(낙관적 업데이트)하고, 다른 세션엔 최대 max-age(2분) 뒤 반영된다.

import { Ad } from "./ads";

// public: 사용자별로 다르지 않음(차단목록은 서버에서 전역 적용). CDN·브라우저 모두 캐시 가능.
// max-age=120: 2분 내 새로고침은 네트워크 0. stale-while-revalidate=1일: 이후엔 캐시를
//   즉시 보여주며 백그라운드로 갱신 → 체감 즉시.
export const LIST_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=120, stale-while-revalidate=86400",
} as const;

// 서버 전용 부기 필드 — 리스트/상세 어디서도 안 쓰므로 응답에서 제거해 전송량을 줄인다.
type ServerOnly = "firstSeen" | "lastSeen";

/** 리스트 응답용 슬림화 — 서버 부기 필드 제거 (클라이언트 미사용). */
export function slimForList(a: Ad): Omit<Ad, ServerOnly> {
  const { firstSeen: _f, lastSeen: _l, ...rest } = a;
  void _f;
  void _l;
  return rest;
}
