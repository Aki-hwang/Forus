"use client";

// 소비자 헤더의 섹션 내비게이션(시술로/지역으로 찾기).
//  - 같은 랜딩 페이지: 해당 섹션으로 "부드럽게" 스크롤(휙 점프 대신). 섹션의 scroll-mt-20 이
//    sticky 헤더 높이를 보정한다.
//  - 하위 페이지(/ko/lifting 등, 섹션이 없음): 링크대로 랜딩+해시로 이동해 그 섹션에서 열린다.
import Link from "next/link";

export function SectionLink({
  base,
  hash,
  className,
  children,
}: {
  base: string; // 예: "/ko"
  hash: "treatments" | "areas";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`${base}#${hash}`}
      className={className}
      onClick={(e) => {
        const el = document.getElementById(hash);
        if (el) {
          // 같은 페이지에 섹션이 있으면 라우팅 대신 부드럽게 스크롤
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", `#${hash}`);
        }
      }}
    >
      {children}
    </Link>
  );
}
