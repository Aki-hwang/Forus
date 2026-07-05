// /tw — 번체권(대만·홍콩) 방문자용 랜딩 (본체: ConsumerLanding)

import { ConsumerLanding, landingMetadata } from "@/components/consumer/ConsumerPages";

export const dynamic = "force-dynamic";
export const metadata = landingMetadata("tw");

export default function TwHome() {
  return <ConsumerLanding locale="tw" />;
}
