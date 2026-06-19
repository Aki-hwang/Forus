export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-base font-black text-white shadow-sm">
            D
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-black tracking-tight text-foreground">
              DermaRadar
            </p>
            <p className="text-[11px] text-muted">피부과 광고 트렌드 레이더</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 text-[13px] font-medium text-muted sm:flex">
          <span className="rounded-lg bg-primary/10 px-3 py-1.5 font-bold text-primary-ink">
            광고 트렌드
          </span>
          <span className="cursor-not-allowed rounded-lg px-3 py-1.5 opacity-60">
            내 광고함
          </span>
          <span className="cursor-not-allowed rounded-lg px-3 py-1.5 opacity-60">
            리포트
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-muted md:inline">
            🇯🇵 일본 타겟
          </span>
          <button className="rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-bold text-white transition hover:opacity-90">
            로그인
          </button>
        </div>
      </div>
    </header>
  );
}
