// 검색엔진용 사이트맵 — /jp 소비자 가이드(시술 7 × 지역 3 + 허브)를 노출한다.

import type { MetadataRoute } from "next";
import { TREATMENT_GUIDES, AREA_GUIDES } from "@/lib/consumer";

const BASE = "https://www.dermaradar.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/jp`, lastModified: now, changeFrequency: "daily", priority: 1 },
  ];
  for (const g of TREATMENT_GUIDES) {
    entries.push({
      url: `${BASE}/jp/${g.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });
    for (const a of AREA_GUIDES) {
      entries.push({
        url: `${BASE}/jp/${g.slug}/${a.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }
  return entries;
}
