"use client";

// 외부 링크 클릭 전면 계측 — 루트 레이아웃에 1회 장착하는 문서 레벨 위임 리스너.
// 대시보드·소비자 페이지의 모든 외부 앵커를 한곳에서 커버해, 서버 컴포넌트 카드를
// 클라이언트로 바꾸지 않고도 표면별(data-oc) 클릭 기여를 GA 로 보낸다.
import { useEffect } from "react";
import { gaEvent } from "@/lib/ga";

export function OutboundTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (!/^https?:$/.test(url.protocol) || url.origin === window.location.origin) return;
      gaEvent("outbound_click", {
        // 표면 라벨은 가장 가까운 data-oc 에서 — 라벨 없는 링크는 other 로 묶인다
        surface: a.closest("[data-oc]")?.getAttribute("data-oc") ?? "other",
        link_domain: url.hostname,
        link_url: url.href.slice(0, 150),
        page_path: window.location.pathname,
      });
    };
    // capture: 모달 등의 stopPropagation 에 막히지 않게 캡처 단계에서 수신
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
