"use client";

// 유앤아이 김포 CTA 링크 — 클릭 계측(gimpo_cta_click)용 클라이언트 아일랜드.
// 소비자 페이지는 서버 렌더 유지가 원칙이라, 계측이 필요한 이 링크만 클라이언트로 분리.
import { gaEvent } from "@/lib/ga";

export function GimpoCta({
  href,
  label,
  locale,
  page,
  treatment,
  cta = "main",
  className,
}: {
  href: string;
  label: string;
  locale: string;
  /** 노출 위치: landing | treatment | combo — 위치별 클릭률 비교용 */
  page: string;
  treatment?: string;
  /** 어떤 버튼인지: main(인스타/홈페이지) | line(상담 채널) */
  cta?: "main" | "line";
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-oc={cta === "line" ? "gimpo_line" : "gimpo_main"}
      className={className}
      onClick={() => gaEvent("gimpo_cta_click", { locale, page, treatment: treatment ?? "", cta })}
    >
      {label}
    </a>
  );
}
