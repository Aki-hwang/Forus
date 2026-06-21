"use client";

// 병원이 자기 인스타그램 등록을 요청하는 버튼 + 모달 폼.
// 제출 → POST /api/register-request → /data 에 저장(관리자가 ?key= 로 조회).

import { useState } from "react";

const AREAS = ["강남", "명동", "홍대", "기타"];

export function RegisterClinic() {
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
      setErr("병원명과 인스타그램은 필수예요.");
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
        className="rounded-lg bg-gradient-to-r from-primary to-accent px-3.5 py-2 text-[13px] font-bold text-white shadow-sm transition hover:opacity-90"
      >
        인스타그램 계정 등록
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
                <p className="text-[16px] font-black text-foreground">병원 인스타그램 등록 요청</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  등록되면 트렌드 대시보드에 우리 병원 게시물이 함께 수집돼요.
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
                <p className="mt-2 text-[15px] font-bold text-foreground">요청이 접수됐어요!</p>
                <p className="mt-1 text-[13px] text-muted">
                  검토 후 다음 수집 때 반영해 드릴게요. 감사합니다.
                </p>
                <button
                  onClick={close}
                  className="mt-5 rounded-lg bg-foreground px-4 py-2 text-[13px] font-bold text-white transition hover:opacity-90"
                >
                  닫기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    병원명 <span className="text-accent">*</span>
                  </label>
                  <input
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                    placeholder="예: 유앤아이의원"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    인스타그램 핸들 / URL <span className="text-accent">*</span>
                  </label>
                  <input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@clinic_official 또는 https://instagram.com/..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">지역</label>
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
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-foreground">
                    연락처 <span className="font-medium text-muted">(선택)</span>
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
                    한마디 <span className="font-medium text-muted">(선택)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="요청 사항이 있다면 적어주세요."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {err ? <p className="text-[12px] font-medium text-accent">{err}</p> : null}

                <button
                  onClick={submit}
                  disabled={state === "sending"}
                  className="w-full rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  {state === "sending" ? "제출 중…" : "등록 요청 보내기"}
                </button>
                <p className="text-center text-[11px] text-muted">
                  제출하신 정보는 등록 검토 용도로만 사용돼요.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
