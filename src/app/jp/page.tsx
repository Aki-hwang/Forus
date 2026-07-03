// /jp — 일본인 여행자용 랜딩 (본체: ConsumerLanding)

import { ConsumerLanding, landingMetadata } from "@/components/consumer/ConsumerPages";

export const dynamic = "force-dynamic";
export const metadata = landingMetadata("jp");

export default function JpHome() {
  return <ConsumerLanding locale="jp" />;
}
