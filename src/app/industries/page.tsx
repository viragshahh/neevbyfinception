import type { Metadata } from "next";
import Link from "next/link";
import { SECTORS } from "@/lib/sectors";

export const metadata: Metadata = {
  title: "NEEV Research | Finception",
  description: "NEEV's ongoing research coverage across its five mandated sectors.",
};

export default function IndustriesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-label text-[11px] text-accent">STUDENT MANAGED FUND</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Industry Coverage
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Explore Finception's research coverage across the five industries tracked by NEEV.
        </p>
      </header>

      <nav className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-2 sm:grid-cols-5">
        {SECTORS.map((sector, index) => (
          <Link
            key={sector.slug}
            href={`/industries/${sector.slug}`}
            className={`rounded-lg px-3 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent ${
              index === 0 ? "bg-accent/10 text-accent" : "text-muted"
            }`}
          >
            {sector.name}
          </Link>
        ))}
      </nav>

      <div className="mt-8 card p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Research will be published here
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Industry research and investment reports will be added as each sector is completed.
          Check back regularly for new coverage.
        </p>
      </div>
    </div>
  );
}
