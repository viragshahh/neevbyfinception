import type { Metadata } from "next";
import ReportsGrid from "@/components/ReportsGrid";
import { listReports } from "@/lib/reports-db";

export const metadata: Metadata = {
  title: "Research Library | Finception",
  description: "Published NEEV and Finception sector research reports and investment reviews.",
};

export default async function ReportsPage() {
  const reports = await listReports();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-label text-[11px] text-accent">Research Library</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Research Library
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Sector deep-dives authored by Finception&apos;s research teams, covering the industries
          that matter most to Indian markets.
        </p>
      </header>

      <ReportsGrid reports={reports} />
    </div>
  );
}
