// 광고 크리에이티브 비주얼. 갤러리/생성결과 공용.
// imageUrl 이 있으면 실제 광고 썸네일을, 없으면 그라데이션+카피를 보여준다.
"use client";

import { useState } from "react";
import { Lang } from "@/lib/ads";

export function CreativeCard({
  palette,
  headline,
  sub,
  clinicName,
  treatmentLabel,
  lang,
  badge,
  imageUrl,
  kind,
}: {
  palette: [string, string];
  headline: string;
  sub: string;
  clinicName: string;
  treatmentLabel: string;
  lang: Lang;
  badge?: string;
  imageUrl?: string;
  kind?: "ad" | "organic";
}) {
  const [imgOk, setImgOk] = useState(true);
  // 인스타/Meta CDN 이미지는 핫링크 차단되므로 서버 프록시 경유로 로드
  const proxied = imageUrl
    ? `/api/img?u=${encodeURIComponent(imageUrl)}`
    : undefined;
  const showImage = Boolean(proxied) && imgOk;

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl"
      style={{
        backgroundImage: `linear-gradient(140deg, ${palette[0]}, ${palette[1]})`,
      }}
    >
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxied}
            alt={clinicName}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* 텍스트 가독성용 스크림 */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
        </>
      ) : (
        <>
          {/* soft glow */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-50 blur-2xl"
            style={{ background: "rgba(255,255,255,0.7)" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
        </>
      )}

      {/* lang / treatment badge */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
          {lang === "JP" ? "🇯🇵 日本語" : lang === "CN" ? "🇨🇳 中文" : lang === "EN" ? "🇬🇧 English" : "🇰🇷 한국어"}
        </span>
        <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {treatmentLabel}
        </span>
      </div>

      {badge ? (
        <span className="absolute right-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow">
          {badge}
        </span>
      ) : null}

      {/* headline — 실제 이미지가 없을 때만 (이미지엔 자체 카피가 있음) */}
      {showImage ? null : (
        <div className="absolute inset-x-0 top-1/2 max-h-[88%] -translate-y-1/2 overflow-hidden px-4 sm:px-5">
          <h3 className="font-jp line-clamp-3 [overflow-wrap:anywhere] text-[15px] font-black leading-[1.2] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:line-clamp-4 sm:text-[22px] sm:leading-[1.25]">
            {headline}
          </h3>
          <p className="font-jp mt-2 line-clamp-2 inline-block max-w-full rounded-md bg-white/25 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {sub}
          </p>
        </div>
      )}

      {/* 종류 칩 (무료=오가닉 / AD=유료) */}
      <span
        className={`absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider shadow-sm ${
          kind === "organic" ? "bg-accent/90 text-white" : "bg-white/85 text-foreground/70"
        }`}
      >
        {kind === "organic" ? "무료" : "유료"}
      </span>
    </div>
  );
}
