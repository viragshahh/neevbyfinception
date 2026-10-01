import type { Metadata } from "next";
import { getDecisions } from "@/lib/google-sheet-portfolio";
import DecisionRegisterList from "@/components/portfolio/DecisionRegisterList";

export const metadata: Metadata = {
  title: "Decision Register | Finception",
  description: "The full Investment Committee decision register for Finception's student-managed fund.",
};

// Decisions can come from a live Google Sheet, so this page renders fresh on
// every request rather than serving a cached copy.
export const revalidate = 0;

export default async function DecisionRegisterPage() {
  const decisions = await getDecisions();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-label text-[11px] text-accent">STUDENT MANAGED FUND</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Decision Register</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Every Investment Committee decision, logged with date, rationale and vote count &mdash;
          the primary input to the annual performance attribution.
        </p>
      </header>

      <DecisionRegisterList decisions={decisions} />
    </div>
  );
}
