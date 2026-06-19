"use client";

import { useEffect, useState } from "react";
import { Ad, Lang, TREATMENT_LABEL } from "@/lib/ads";
import { GeneratedCreative } from "@/lib/generate";
import { CreativeCard } from "./CreativeCard";

export function AdDetailModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const [clinicName, setClinicName] = useState("Forus Clinic");
  const [lang, setLang] = useState<Lang>(ad.lang);
  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCreative | null>(null);
  const [copied, setCopied] = useState(false);

  // ESC 닫기 + 스크롤 락
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function generate(nextSeed: number) {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId: ad.id,
          reference: ad,
          clinicName,
          area: ad.area,
          lang,
          seed: nextSeed,
        }),
      });
      const data = await res.json();
      setResult(data.creative);
      setSeed(nextSeed);
    } finally {
      setLoading(false);
    }
  }

  function copyCaption() {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="animate-fadeup relative my-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-foreground transition hover:bg-black/20"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* 좌: 레퍼런스 광고 */}
          <div className="border-b border-border bg-background p-5 md:border-b-0 md:border-r">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-muted">
              레퍼런스 광고
            </p>
            <CreativeCard
              palette={ad.palette}
              headline={ad.headline}
              sub={ad.sub}
              clinicName={ad.clinic.replace(/\s*\(.*\)$/, "")}
              treatmentLabel={TREATMENT_LABEL[ad.treatment][ad.lang === "JP" ? "jp" : "ko"]}
              lang={ad.lang}
            />
            <div className="mt-4 space-y-2 text-[13px]">
              <p className="font-bold text-foreground">{ad.clinic}</p>
              <p className="leading-relaxed text-muted">{ad.caption}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {ad.hashtags.map((h) => (
                  <span key={h} className="text-[12px] text-primary-ink">
                    {h}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[12px] font-medium text-muted">
                {ad.live ? (
                  <>
                    <span>📍 {ad.area}</span>
                    <span>📅 {ad.activeDays ?? 0}일 집행</span>
                    {ad.platforms?.length ? (
                      <span>{ad.platforms.slice(0, 2).join(" · ")}</span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span>♡ {ad.likes.toLocaleString()}</span>
                    <span>🔖 {ad.saves.toLocaleString()}</span>
                    <span>📍 {ad.area}</span>
                  </>
                )}
              </div>
              {ad.sourceUrl ? (
                <a
                  href={ad.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 pt-1 text-[12px] font-bold text-primary-ink hover:underline"
                >
                  ↗ 원본 광고 / 사이트 보기
                </a>
              ) : null}
            </div>
          </div>

          {/* 우: 생성 패널 */}
          <div className="flex flex-col p-5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-primary-ink">
              ✨ 우리 광고 자동 생성
            </p>

            {!result ? (
              <div className="flex flex-1 flex-col">
                <Controls
                  clinicName={clinicName}
                  setClinicName={setClinicName}
                  lang={lang}
                  setLang={setLang}
                />
                <div className="mt-auto pt-4">
                  <GenerateButton loading={loading} onClick={() => generate(0)} />
                  <p className="mt-2 text-center text-[11px] text-muted">
                    레퍼런스의 시술·카피·컬러를 분석해 우리 버전을 만듭니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col">
                <CreativeCard
                  palette={result.palette}
                  headline={result.headline}
                  sub={result.sub}
                  clinicName={result.clinicName}
                  treatmentLabel={result.treatmentLabel}
                  lang={result.lang}
                  badge="NEW"
                />

                <div className="mt-3 rounded-xl border border-border bg-background p-3">
                  <p className="font-jp text-[12.5px] leading-relaxed text-foreground">
                    {result.caption}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {result.hashtags.map((h) => (
                      <span key={h} className="text-[12px] font-medium text-primary-ink">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <details className="mt-2 text-[12px] text-muted">
                  <summary className="cursor-pointer font-medium">
                    레퍼런스에서 가져온 요소
                  </summary>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                    {result.borrowedFrom.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </details>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                  <button
                    onClick={() => generate(seed + 1)}
                    disabled={loading}
                    className="rounded-xl border border-border bg-surface py-2.5 text-[13px] font-bold text-foreground transition hover:bg-background disabled:opacity-60"
                  >
                    {loading ? "생성 중…" : "🔄 다른 버전"}
                  </button>
                  <button
                    onClick={copyCaption}
                    className="rounded-xl bg-foreground py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
                  >
                    {copied ? "복사됨 ✓" : "캡션 복사"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Controls({
  clinicName,
  setClinicName,
  lang,
  setLang,
}: {
  clinicName: string;
  setClinicName: (v: string) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-bold text-foreground">
          우리 병원 이름
        </label>
        <input
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          placeholder="예: Forus 피부과"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[14px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-bold text-foreground">
          타겟 언어
        </label>
        <div className="inline-flex w-full rounded-xl border border-border bg-background p-1">
          {(["JP", "CN"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition ${
                lang === l ? "bg-surface text-foreground shadow-sm" : "text-muted"
              }`}
            >
              {l === "JP" ? "🇯🇵 일본어" : "🇨🇳 중국어"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenerateButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-[14px] font-black text-white shadow-md transition hover:opacity-95 disabled:opacity-70"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          생성 중…
        </>
      ) : (
        "✨ 우리 광고 생성하기"
      )}
    </button>
  );
}
