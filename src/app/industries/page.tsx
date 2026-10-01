import type { Metadata } from "next";
import Link from "next/link";
import { listAllIndustryContent } from "@/lib/portfolio-db";
import { LAYERS, SECTORS } from "@/lib/sectors";

export const metadata: Metadata = {
  title: "Industry Coverage | Finception",
  description: "Finception's ongoing sector research across the five mandated industries.",
};

export const revalidate = 300;

export default async function IndustriesPage() {
  const content = await listAllIndustryContent();

  const coverage = SECTORS.map((s) => {
    const layersPublished = LAYERS.filter((l) =>
      content.some((c) => c.sectorSlug === s.slug && c.layer === l.key)
    ).length;
    const overview = content.find((c) => c.sectorSlug === s.slug && c.layer === "overview");
    return { ...s, layersPublished, blurb: overview?.content ?? null };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-label text-[11px] text-accent">STUDENT MANAGED FUND</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Industry Coverage</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Each sector builds one permanent research layer per month &mdash; Overview, Value Chain,
          Business Model, Financial Dashboard, Valuation, Governance &amp; ESG, Growth &amp; Risk,
          and the Annual Review.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {coverage.map((s) => (
          <Link
            key={s.slug}
            href={`/industries/${s.slug}`}
            className="card group flex flex-col p-5 transition-colors hover:border-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-medium text-foreground group-hover:text-accent">
                {s.name}
              </h2>
              <span className="shrink-0 font-mono text-[10px] text-muted">
                {s.layersPublished}/{LAYERS.length} layers
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted">
              {s.blurb ?? "Coverage not yet published for this sector."}
            </p>
            <div className="mt-4 flex gap-1">
              {LAYERS.map((l, i) => (
                <span
                  key={l.key}
                  className={`h-1 flex-1 rounded-full ${
                    i < s.layersPublished ? "bg-accent" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
