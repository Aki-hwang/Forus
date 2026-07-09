"use client";

// 문의하기 버튼 + 모달. 제출 → POST /api/inquiry → /data 저장(관리자 ?key= 로 확인).
import { useState } from "react";
import { useUiLang } from "@/lib/i18n";

export function InquiryButton() {
  const { t } = useUiLang();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const reset = () => {
    setName("");
    setContact("");
    setMessage("");
    setState("idle");
    setErr("");
  };
  const close = () => {
    setOpen(false);
    if (state === "done") reset();
  };

  const submit = async () => {
    // 연락처 필수 — 회신할 수 없는 문의는 받아도 응대가 불가능하다
    if (!name.trim() || !contact.trim() || !message.trim()) {
      setErr(t("errReqInq"));
      return;
    }
    setState("sending");
    setErr("");
    try {
      const r = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message }),
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
        className="whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-bold text-foreground transition hover:bg-background sm:px-3.5 sm:text-[13px]"
      >
        {t("inquiry")}
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
                <p className="text-[16px] font-black text-foreground">{t("inqTitle")}</p>
                <p className="mt-0.5 text-[12px] text-muted">{t("inqSub")}</p>
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
                <p className="mt-2 text-[15px] font-bold text-foreground">{t("inqDoneTitle")}</p>
                <p className="mt-1 text-[13px] text-muted">{t("inqDoneDesc")}</p>
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("inqNamePh")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    {t("fContact")} <span className="text-accent">*</span>
                  </label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t("fContactPh")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    {t("inqMsg")} <span className="text-accent">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder={t("inqMsgPh")}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {err ? <p className="text-[12px] font-medium text-accent">{err}</p> : null}

                <button
                  onClick={submit}
                  disabled={state === "sending"}
                  className="w-full rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  {state === "sending" ? t("sending") : t("inqSend")}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
