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
          Published research outputs from NEEV and Finception&apos;s research teams. This library
          is for completed reports and reviews; ongoing sector work remains under NEEV Research.
        </p>
      </header>

      <ReportsGrid reports={reports} />
    </div>
  );
}
