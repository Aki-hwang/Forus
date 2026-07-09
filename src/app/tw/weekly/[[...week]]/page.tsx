// /tw/weekly — 每週雷達報告 (본체: ConsumerWeeklyPage)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConsumerWeeklyPage, weeklyMetadataChecked } from "@/components/consumer/WeeklyPage";

export const dynamic = "force-dynamic";

type Params = { week?: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { week } = await params;
  return weeklyMetadataChecked("tw", week);
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { week } = await params;
  if (week && week.length > 1) notFound();
  return <ConsumerWeeklyPage locale="tw" week={week?.[0]} />;
}
