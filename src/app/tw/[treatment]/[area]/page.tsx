// /tw/[treatment]/[area] — 시술×지역 가이드 (본체: ConsumerTreatmentAreaPage)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  TREATMENT_GUIDES,
  AREA_GUIDES,
  guideBySlug,
  areaBySlug,
} from "@/lib/consumer";
import {
  ConsumerTreatmentAreaPage,
  comboMetadata,
} from "@/components/consumer/ConsumerPages";

export const dynamic = "force-dynamic";

type Params = { treatment: string; area: string };

export function generateStaticParams(): Params[] {
  return TREATMENT_GUIDES.tw.flatMap((g) =>
    AREA_GUIDES.tw.map((a) => ({ treatment: g.slug, area: a.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { treatment, area } = await params;
  const g = guideBySlug("tw", treatment);
  const a = areaBySlug("tw", area);
  return g && a ? comboMetadata("tw", g, a) : {};
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { treatment, area } = await params;
  const g = guideBySlug("tw", treatment);
  const a = areaBySlug("tw", area);
  if (!g || !a) notFound();
  return <ConsumerTreatmentAreaPage locale="tw" g={g} a={a} />;
}
