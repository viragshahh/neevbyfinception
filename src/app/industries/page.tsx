import type { Metadata } from "next";
import Link from "next/link";
import ReportsGrid from "@/components/ReportsGrid";
import { listReports } from "@/lib/reports-db";
import { SECTORS } from "@/lib/sectors";

export const metadata: Metadata = {
  title: "NEEV Research",
  description: "NEEV's recurring monthly research publications supporting the Indian equity investment process.",
};

export default async function IndustriesPage() {
  const reports = await listReports();
  const monthlyReports = reports.filter((report) => report.type === "monthly_review");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-label text-[11px] text-accent">RESEARCH &amp; LIBRARY</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          NEEV Research
        </h1>
        <p className="mt-3 max-w-3xl text-muted">
          The recurring research publication stream of NEEV. Monthly reports document sector,
          value-chain and company-level work as the investment process develops.
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

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label text-[10px] text-accent">RECURRING PUBLICATIONS</p>
            <h2 className="mt-1 text-2xl font-semibold">Monthly NEEV Research</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Monthly research reports published as they are completed and reviewed.
            </p>
          </div>
          <Link href="/reports" className="text-sm font-medium text-accent hover:underline">
            Open NEEV Library →
          </Link>
        </div>

        {monthlyReports.length > 0 ? (
          <ReportsGrid reports={monthlyReports} />
        ) : (
          <div className="card p-8 text-center">
            <h3 className="text-lg font-semibold">Monthly research is being developed</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
              Monthly reports will be published here as the research cycle progresses and reports
              are completed and reviewed. Developing work is intentionally not presented as
              completed research.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
