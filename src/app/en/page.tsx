// /en — 영어권 방문자용 랜딩 (본체: ConsumerLanding)

import { ConsumerLanding, landingMetadata } from "@/components/consumer/ConsumerPages";

export const dynamic = "force-dynamic";
export const metadata = landingMetadata("en");

export default function EnHome() {
  return <ConsumerLanding locale="en" />;
}
