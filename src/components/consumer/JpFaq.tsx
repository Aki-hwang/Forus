// FAQ 섹션 + FAQPage/BreadcrumbList JSON-LD (서버 렌더 전용, SEO용)

import { FaqItem } from "@/lib/consumer";

export function JpFaq({ items, title = "よくある質問" }: { items: FaqItem[]; title?: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[18px] font-black text-foreground">{title}</h2>
      <div className="space-y-2">
        {items.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <summary className="cursor-pointer list-none text-[13.5px] font-bold text-foreground">
              Q. {f.q}
            </summary>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
