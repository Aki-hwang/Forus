// 검색엔진용 사이트맵 — 소비자 가이드(/jp·/ko × 시술 7 × 지역 3 + 허브)와
// 주간 레이더 리포트(/weekly + 데이터가 있는 과거 주차)를 노출한다.

import type { MetadataRoute } from "next";
import {
  TREATMENT_GUIDES,
  AREA_GUIDES,
  CONSUMER_LOCALES,
  loadConsumerData,
} from "@/lib/consumer";
import { availableWeeks, WEEK_MS } from "@/lib/weekly";

const BASE = "https://www.dermaradar.kr";

// 스냅샷·현재 시각 의존 — 기본값(빌드 시 정적 프리렌더)이면 주차 목록이 배포 시점에
// 동결되고, Railway 빌드 컨테이너엔 /data 볼륨이 없어 아카이브가 0건으로 굳는다.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    // 주간 리포트 — /weekly(최신, 매주 갱신) + 과거 주차 아카이브 (내용 고정)
    entries.push({
      url: `${BASE}/${locale}/weekly`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
    const weeks = availableWeeks(await loadConsumerData(locale), now.getTime());
    for (const w of weeks.slice(1)) {
      // weeks[0](최신)은 /weekly 가 대표 URL — 일자 URL 은 아카이브만 등록.
      // 아카이브 내용은 그 주가 끝난 시점 이후 고정 — lastModified 를 현재 시각으로
      // 찍으면 거짓 갱신 신호가 되어 구글이 lastmod 자체를 무시하게 된다.
      entries.push({
        url: `${BASE}/${locale}/weekly/${w}`,
        lastModified: new Date(Date.parse(`${w}T00:00:00Z`) + WEEK_MS),
        changeFrequency: "yearly",
        priority: 0.6,
      });
    }
  }
  return entries;
}
