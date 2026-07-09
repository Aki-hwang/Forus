// /en/weekly — Weekly Radar report (본체: ConsumerWeeklyPage)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConsumerWeeklyPage, weeklyMetadata } from "@/components/consumer/WeeklyPage";

export const dynamic = "force-dynamic";

type Params = { week?: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { week } = await params;
  if (week && week.length > 1) return {};
  return weeklyMetadata("en", week?.[0] ?? null);
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { week } = await params;
  if (week && week.length > 1) notFound();
  return <ConsumerWeeklyPage locale="en" week={week?.[0]} />;
}
