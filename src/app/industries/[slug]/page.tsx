import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listIndustryContent } from "@/lib/portfolio-db";
import { getSector, LAYERS, SECTORS } from "@/lib/sectors";

export function generateStaticParams() {
  return SECTORS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = getSector(slug);
  return {
    title: sector ? `${sector.name} | Finception` : "Industry | Finception",
    description: sector
      ? `Finception's ongoing research coverage of ${sector.name}.`
      : undefined,
  };
}

export const revalidate = 300;

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = getSector(slug);
  if (!sector) notFound();

  const content = await listIndustryContent(slug);
  const publishedCount = LAYERS.filter((l) => content.some((c) => c.layer === l.key)).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="font-label text-[11px] text-accent">INDUSTRY COVERAGE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{sector.name}</h1>
        <p className="mt-3 text-muted">
          {publishedCount} of {LAYERS.length} monthly layers published.
        </p>
        <div className="mt-4 flex gap-1">
          {LAYERS.map((l, i) => (
            <span
              key={l.key}
              className={`h-1.5 flex-1 rounded-full ${
                i < publishedCount ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>
      </header>

      <div className="space-y-6">
        {LAYERS.map((layer) => {
          const entry = content.find((c) => c.layer === layer.key);
          return (
            <section key={layer.key} className="card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">{layer.label}</h2>
                <span className="font-mono text-xs text-muted">{layer.month}</span>
              </div>
              <p className="mt-1 text-xs italic text-muted">{layer.question}</p>
              {entry ? (
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {entry.content}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">Not yet published.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
