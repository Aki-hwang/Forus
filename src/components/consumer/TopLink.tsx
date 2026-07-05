"use client";

// 클릭 시 페이지 맨 위로 스크롤하는 링크 — 같은 페이지에서 누르면 Next 가 내비게이션을
// 생략해 아무 일도 안 일어나므로, onClick 으로 직접 최상단 이동(새로고침 느낌)을 보장한다.
import Link from "next/link";

export function TopLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => window.scrollTo(0, 0)}>
      {children}
    </Link>
  );
}
