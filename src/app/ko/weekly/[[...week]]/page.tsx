// /ko/weekly — 주간 레이더 리포트 (본체: ConsumerWeeklyPage, 파라미터 검증 포함)

import type { Metadata } from "next";
import { ConsumerWeeklyPage, weeklyMetadataChecked } from "@/components/consumer/WeeklyPage";

export const dynamic = "force-dynamic";

type Params = { week?: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { week } = await params;
  return weeklyMetadataChecked("ko", week);
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { week } = await params;
  return <ConsumerWeeklyPage locale="ko" week={week} />;
}
