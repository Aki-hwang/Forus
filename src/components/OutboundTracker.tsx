"use client";

// 외부 링크 클릭 전면 계측 — 루트 레이아웃에 1회 장착하는 문서 레벨 위임 리스너.
// 대시보드·소비자 페이지의 모든 외부 앵커를 한곳에서 커버해, 서버 컴포넌트 카드를
// 클라이언트로 바꾸지 않고도 표면별(data-oc) 클릭 기여를 GA 로 보낸다.
//
// data-oc 표면 라벨 목록 — 새 라벨을 추가하면 여기에도 기록할 것 (GA 버킷 드리프트 방지):
//   modal_post · modal_account · trend_account · guide_post · guide_promo
//   guide_clinic · guide_clinic_line · gimpo_main · gimpo_line
import { useEffect } from "react";
import { gaEvent } from "@/lib/ga";

export function OutboundTracker() {
  useEffect(() => {
    const track = (e: MouseEvent) => {
      // auxclick 은 가운데 버튼(새 탭 열기)만 계측 — 우클릭은 이동이 아니다
      if (e.type === "auxclick" && e.button !== 1) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      // 앵커가 이미 절대 URL 을 파싱해 둔다(origin/protocol/hostname) — URL 재파싱 불필요.
      // 클릭 대부분은 내부 이동이므로 가장 싼 same-origin 비교를 먼저.
      if (a.origin === window.location.origin || !/^https?:$/.test(a.protocol)) return;
      gaEvent("outbound_click", {
        // 라벨 없는 링크는 unlabeled — '계측 누락' 을 정당한 표면과 구분하는 센티널
        surface: a.closest("[data-oc]")?.getAttribute("data-oc") ?? "unlabeled",
        link_domain: a.hostname,
        // GA4 이벤트 파라미터 값 상한은 100자 — 넘기면 파라미터가 통째로 버려진다
        link_url: a.href.slice(0, 100),
        page_path: window.location.pathname,
      });
    };
    // capture: 모달 등의 stopPropagation 에 막히지 않게 캡처 단계에서 수신
    document.addEventListener("click", track, true);
    document.addEventListener("auxclick", track, true);
    return () => {
      document.removeEventListener("click", track, true);
      document.removeEventListener("auxclick", track, true);
    };
  }, []);
  return null;
}
