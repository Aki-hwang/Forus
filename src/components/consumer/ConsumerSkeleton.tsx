// 소비자 페이지 로딩 스켈레톤 — 세그먼트 loading.tsx 공용.
// force-dynamic 라우트는 loading 경계가 있어야 <Link> 가 셸을 프리페치하고
// 클릭 즉시 스켈레톤을 띄운다(서버 렌더 대기 중 '멈춤' 체감 제거).

function Card({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface ${className}`}
    />
  );
}

export default function ConsumerSkeleton() {
  return (
    <div className="space-y-10" aria-hidden="true">
      {/* 히어로 */}
      <section className="space-y-3 pt-2 text-center sm:pt-6">
        <div className="mx-auto h-8 w-3/4 max-w-md animate-pulse rounded-lg bg-surface sm:h-10" />
        <div className="mx-auto h-4 w-2/3 max-w-lg animate-pulse rounded bg-surface" />
      </section>

      {/* 시술 그리드 */}
      <section className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-24" />
          ))}
        </div>
      </section>

      {/* 게시물 그리드 */}
      <section className="space-y-3">
        <div className="h-5 w-36 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="aspect-square" />
          ))}
        </div>
      </section>
    </div>
  );
}
