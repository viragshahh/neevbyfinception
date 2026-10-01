import type { Metadata } from "next";
import Link from "next/link";
import ReportsGrid from "@/components/ReportsGrid";
import { listReports } from "@/lib/reports-db";

export const metadata: Metadata = {
  title: "NEEV Library",
  description: "NEEV's institutional library of investment records, performance reports, portfolio reviews and other formal publications.",
};

export default async function ReportsPage() {
  const reports = await listReports();
  const libraryReports = reports.filter((report) => report.type !== "monthly_review");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-label text-[11px] text-accent">RESEARCH &amp; LIBRARY</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          NEEV Library
        </h1>
        <p className="mt-3 max-w-3xl text-muted">
          The formal document repository for NEEV. Investment decision memos, performance reports,
          portfolio reviews, committee records and other completed publications belong here.
          Recurring monthly research is kept separately under NEEV Research.
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Investment Decision Memos", "Documented investment theses, valuation work, risks and decision rationale."],
          ["Performance Reports", "Periodic portfolio performance, attribution and risk reporting as the data system matures."],
          ["Portfolio Reviews", "Formal reviews of portfolio construction, fundamentals, valuation and thesis status."],
          ["Investment Committee Records", "Published governance records and decision documentation."],
          ["Annual Reviews", "Year-end review of performance, process, portfolio and lessons."],
          ["Methodology & Disclosures", "Definitions, calculation methods, data sources and important limitations."],
        ].map(([title, text]) => (
          <div key={title} className="card p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
          </div>
        ))}
      </div>

      <ReportsGrid reports={libraryReports} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/disclosures" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:border-accent hover:text-accent">
          Reports &amp; Disclosures →
        </Link>
        <Link href="/methodology" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:border-accent hover:text-accent">
          Methodology →
        </Link>
      </div>
    </div>
  );
}
