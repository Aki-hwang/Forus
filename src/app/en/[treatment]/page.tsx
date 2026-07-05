// /en/[treatment] — 시술 가이드 (본체: ConsumerTreatmentPage)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TREATMENT_GUIDES, guideBySlug } from "@/lib/consumer";
import {
  ConsumerTreatmentPage,
  treatmentMetadata,
} from "@/components/consumer/ConsumerPages";

export const dynamic = "force-dynamic";

type Params = { treatment: string };

export function generateStaticParams(): Params[] {
  return TREATMENT_GUIDES.en.map((g) => ({ treatment: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { treatment } = await params;
  const g = guideBySlug("en", treatment);
  return g ? treatmentMetadata("en", g) : {};
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { treatment } = await params;
  const g = guideBySlug("en", treatment);
  if (!g) notFound();
  return <ConsumerTreatmentPage locale="en" g={g} />;
}
