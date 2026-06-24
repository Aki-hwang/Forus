"use client";

// 병원이 자기 인스타그램 등록을 요청하는 버튼 + 모달 폼.
// 제출 → POST /api/register-request → /data 에 저장(관리자가 ?key= 로 조회).

import { useState } from "react";
import { useUiLang } from "@/lib/i18n";

const AREAS = ["강남", "명동", "홍대", "기타"];

export function RegisterClinic() {
  const { t, tArea } = useUiLang();
  const [open, setOpen] = useState(false);
  const [clinic, setClinic] = useState("");
  const [instagram, setInstagram] = useState("");
  const [area, setArea] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const reset = () => {
    setClinic("");
    setInstagram("");
    setArea("");
    setContact("");
    setMessage("");
    setState("idle");
    setErr("");
  };

  const close = () => {
    setOpen(false);
    // 완료 후 닫으면 폼 초기화
    if (state === "done") reset();
  };

  const submit = async () => {
    if (!clinic.trim() || !instagram.trim()) {
      setErr(t("errReqReg"));
      return;
    }
    setState("sending");
    setErr("");
    try {
      const r = await fetch("/api/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinic, instagram, area, contact, message }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || "제출에 실패했어요.");
      }
      setState("done");
    } catch (e) {
      setState("error");
      setErr(e instanceof Error ? e.message : "제출에 실패했어요.");
    }
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition focus:border-primary/50";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-[12px] font-bold text-primary-ink transition hover:bg-primary/15 sm:px-3.5 sm:text-[13px]"
      >
        <span className="sm:hidden">{t("registerShort")}</span>
        <span className="hidden sm:inline">{t("register")}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[16px] font-black text-foreground">{t("regTitle")}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {t("regSub")}
                </p>
              </div>
              <button
                onClick={close}
                className="shrink-0 rounded-md px-2 py-1 text-[15px] text-muted transition hover:text-foreground"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {state === "done" ? (
              <div className="py-8 text-center">
                <p className="text-[32px]">✅</p>
                <p className="mt-2 text-[15px] font-bold text-foreground">{t("regDoneTitle")}</p>
                <p className="mt-1 text-[13px] text-muted">
                  {t("regDoneDesc")}
                </p>
                <button
                  onClick={close}
                  className="mt-5 rounded-lg bg-foreground px-4 py-2 text-[13px] font-bold text-white transition hover:opacity-90"
                >
                  {t("close")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    {t("fName")} <span className="text-accent">*</span>
                  </label>
                  <input
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                    placeholder={t("fNamePh")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    {t("fIg")} <span className="text-accent">*</span>
                  </label>
                  <input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder={t("fIgPh")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">{t("fArea")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AREAS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setArea(area === a ? "" : a)}
                        className={`rounded-lg border px-3 py-1.5 text-[13px] font-bold transition ${
                          area === a
                            ? "border-primary bg-primary/10 text-primary-ink"
                            : "border-border text-muted hover:text-foreground"
                        }`}
                      >
                        {tArea(a)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    {t("fContact")} <span className="font-medium text-muted">{t("optional")}</span>
                  </label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="이메일 또는 전화번호"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    {t("fOneLine")} <span className="font-medium text-muted">{t("optional")}</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder={t("fOneLinePh")}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {err ? <p className="text-[12px] font-medium text-accent">{err}</p> : null}

                <button
                  onClick={submit}
                  disabled={state === "sending"}
                  className="w-full rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  {state === "sending" ? t("sending") : t("regSend")}
                </button>
                <p className="text-center text-[11px] text-muted">
                  {t("regPrivacy")}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
