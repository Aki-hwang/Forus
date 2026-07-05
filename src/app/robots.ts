// robots.txt (Next App Router 자동 생성 → /robots.txt)
// 전체 크롤링 허용 + 사이트맵 위치 명시(구글·네이버가 자동 발견). 수집/관리 API 는 차단.

import type { MetadataRoute } from "next";

const BASE = "https://www.dermaradar.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 조회 외 엔드포인트는 색인 대상 아님(수집·차단·인증콜백 등)
      disallow: ["/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
