// 광고 크리에이티브 비주얼 (그라데이션 + 카피). 갤러리/생성결과 공용.
import { Lang } from "@/lib/ads";

export function CreativeCard({
  palette,
  headline,
  sub,
  clinicName,
  treatmentLabel,
  lang,
  badge,
}: {
  palette: [string, string];
  headline: string;
  sub: string;
  clinicName: string;
  treatmentLabel: string;
  lang: Lang;
  badge?: string;
}) {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl"
      style={{
        backgroundImage: `linear-gradient(140deg, ${palette[0]}, ${palette[1]})`,
      }}
    >
      {/* soft glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-50 blur-2xl"
        style={{ background: "rgba(255,255,255,0.7)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

      {/* lang / treatment badge */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
          {lang === "JP" ? "🇯🇵 日本語" : "🇨🇳 中文"}
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

      {/* headline */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5">
        <h3
          className="font-jp whitespace-pre-line text-[22px] font-black leading-[1.25] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
        >
          {headline}
        </h3>
        <p className="font-jp mt-2 inline-block rounded-md bg-white/25 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          {sub}
        </p>
      </div>

      {/* clinic footer */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3">
        <span className="text-[11px] font-bold text-white/95 drop-shadow">
          {clinicName}
        </span>
        <span className="rounded bg-white/85 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-foreground/70">
          AD
        </span>
      </div>
    </div>
  );
}
