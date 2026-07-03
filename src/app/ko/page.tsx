// /ko — 한국인용 랜딩: 요즘 뜨는 시술 + 진행 중 이벤트 레이더 (본체: ConsumerLanding)

import { ConsumerLanding, landingMetadata } from "@/components/consumer/ConsumerPages";

export const dynamic = "force-dynamic";
export const metadata = landingMetadata("ko");

export default function KoHome() {
  return <ConsumerLanding locale="ko" />;
}
