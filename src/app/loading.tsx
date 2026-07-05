// 루트(대시보드) 로딩 경계 — /jp 등에서 홈으로 돌아올 때 즉시 스켈레톤을 띄운다.
// (소비자 세그먼트는 각자 loading.tsx 가 있어 이 파일은 홈에만 적용)

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-5" aria-hidden="true">
      {/* 필터/헤더 바 */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-surface" />
        ))}
      </div>
      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
