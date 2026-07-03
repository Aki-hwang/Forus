// 검색엔진용 사이트맵 — 소비자 가이드(/jp·/ko × 시술 7 × 지역 3 + 허브)를 노출한다.

import type { MetadataRoute } from "next";
import { TREATMENT_GUIDES, AREA_GUIDES, CONSUMER_LOCALES } from "@/lib/consumer";

const BASE = "https://www.dermaradar.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];
  for (const locale of CONSUMER_LOCALES) {
    entries.push({
      url: `${BASE}/${locale}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    });
    for (const g of TREATMENT_GUIDES[locale]) {
      entries.push({
        url: `${BASE}/${locale}/${g.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });
      for (const a of AREA_GUIDES[locale]) {
        entries.push({
          url: `${BASE}/${locale}/${g.slug}/${a.slug}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    }
  }
  return entries;
}
