"use client";

// 관리자(?key=) 전용: 데이터 수집 패널.
//  - 테스트(시뮬레이션): Apify 미사용·무료. 저장/병합 파이프라인만 검증.
//  - 실제 수집: Apify 크레딧 사용. 광고→무료 순차 실행(90일 누적 병합 + 이미지 선캐시).
import { useCallback, useEffect, useState } from "react";

interface Status {
  ready?: boolean;
  snapshots?: {
    ads?: { count: number; collectedAt: string };
    organic?: { count: number; collectedAt: string };
  };
}

function fmtTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("ko-KR");
}

export function AdminCollect({ adminKey }: { adminKey: string }) {
  const [open, setOpen] = useState(true);
  const [st, setSt] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");

  const loadStatus = useCallback(() => {
    fetch(`/api/status`)
      .then((r) => r.json())
      .then((d) => setSt(d))
      .catch(() => setSt(null));
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const k = encodeURIComponent(adminKey);

  const simulate = async () => {
    setBusy(true);
    setLog("시뮬레이션 실행 중… (Apify 미사용)");
    try {
      const r = await fetch(`/api/collect?key=${k}&simulate=1`).then((x) => x.json());
      setLog("테스트 완료 ✅  " + JSON.stringify(r.ads ?? {}) + " / 무료 " + JSON.stringify(r.organic ?? {}));
      loadStatus();
    } catch (e) {
      setLog("테스트 실패: " + String(e));
    } finally {
      setBusy(false);
    }
  };

  const collect = async () => {
    if (
      !confirm(
        "실제 수집은 Apify 크레딧을 사용합니다. (광고 → 무료 순서로 진행)\n수집 1회 비용은 예산 한도(APIFY_BUDGET_USD·기본 $7) 안으로 자동 조절됩니다.\n계속할까요?"
      )
    )
      return;
    setBusy(true);
    try {
      setLog("① 광고 수집 중… (최대 몇 분)");
      const a = await fetch(`/api/collect?key=${k}&full=1&part=ads`).then((x) => x.json());
      setLog(`광고: ${JSON.stringify(a)}\n② 무료 게시물 수집 중…`);
      const o = await fetch(`/api/collect?key=${k}&full=1&part=organic`).then((x) => x.json());
      // 두 요청의 예상비용 합계 vs 예산 — 한눈에 보이게 상단에 요약
      const est = (Number(a?.estCostUsd) || 0) + (Number(o?.estCostUsd) || 0);
      const budget = Number(o?.budgetUsd ?? a?.budgetUsd);
      const cost = `💰 이번 수집 예상비용 ≈ $${est.toFixed(2)}${
        Number.isFinite(budget) ? ` / 예산 $${budget.toFixed(2)}` : ""
      } (상한 추정·실제는 보통 더 적음)`;
      setLog(`완료 ✅\n${cost}\n광고: ${JSON.stringify(a)}\n무료: ${JSON.stringify(o)}`);
      loadStatus();
    } catch (e) {
      setLog("수집 실패: " + String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-surface p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <p className="text-[13px] font-bold text-foreground">🛰️ 데이터 수집</p>
        <span className="text-[12px] text-muted">{open ? "▲ 접기" : "▼ 펼치기"}</span>
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-lg border border-border bg-background p-2.5">
              <p className="text-muted">광고 스냅샷</p>
              <p className="font-bold text-foreground">{st?.snapshots?.ads?.count ?? "-"}건</p>
              <p className="text-[11px] text-muted">{fmtTime(st?.snapshots?.ads?.collectedAt)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-2.5">
              <p className="text-muted">무료 스냅샷</p>
              <p className="font-bold text-foreground">{st?.snapshots?.organic?.count ?? "-"}건</p>
              <p className="text-[11px] text-muted">{fmtTime(st?.snapshots?.organic?.collectedAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={simulate}
              disabled={busy}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-bold text-foreground transition hover:bg-background disabled:opacity-50"
            >
              테스트(시뮬레이션·무료)
            </button>
            <button
              onClick={collect}
              disabled={busy}
              className="rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-[12px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              실제 수집 (Apify 사용)
            </button>
          </div>

          {log ? (
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-2.5 text-[11px] text-foreground">
              {busy ? "⏳ " : ""}
              {log}
            </pre>
          ) : (
            <p className="text-[11px] text-muted">
              테스트는 Apify를 쓰지 않고 저장·병합 동작만 점검해요. 실제 수집은 크레딧을 사용합니다.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
