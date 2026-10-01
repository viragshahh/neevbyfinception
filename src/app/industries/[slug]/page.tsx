import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { listIndustryContent } from "@/lib/portfolio-db";
import { getSector, SECTORS } from "@/lib/sectors";

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
    title: sector ? sector.name + " | Finception" : "Industry | Finception",
    description: sector
      ? "Finception's ongoing research coverage of " + sector.name + "."
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="font-label text-[11px] text-accent">INDUSTRY COVERAGE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{sector.name}</h1>
        <p className="mt-3 text-muted">
          Research and investment insights for {sector.name} will be published here as they are completed.
        </p>
      </header>

      {content.length > 0 ? (
        <div className="space-y-6">
          {content.map((entry) => (
            <section key={entry.id} className="card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {entry.title ?? "Research Update"}
                </h2>
                {entry.publishedAt ? (
                  <span className="font-mono text-xs text-muted">
                    {new Date(entry.publishedAt).toLocaleDateString("en-IN")}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {entry.content}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Research coming soon</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            This industry page will be updated as research is completed and published.
          </p>
          <Link
            href="/industries"
            className="mt-5 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Back to Industry Coverage
          </Link>
        </div>
      )}
    </div>
  );
}
