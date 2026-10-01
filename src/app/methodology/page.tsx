import type { Metadata } from "next";
import { FUND_CONFIG } from "@/lib/sectors";

export const metadata: Metadata = {
  title: "Methodology & Disclosures",
  description: "NEEV performance, portfolio, benchmark and data methodology.",
};

const items = [
  ["Portfolio valuation", "Active positions are valued using the latest available market quote. The current ledger model is transitional and does not yet represent a full transaction-level accounting system."],
  ["Performance", "Published return statistics are derived from the available NEEV valuation history. External cash flows, dividends, transaction costs and corporate actions must be incorporated before treating the series as a complete institutional track record."],
  ["Benchmark", "The governing benchmark is Nifty 500 TRI. The site will not substitute the Nifty 500 price index for TRI merely because a convenient market-data ticker is available."],
  ["Risk controls", "Exposure checks use the Fund Charter limits: 8% initial position guideline, 10% individual position limit, 30% sector limit, 15–25 holdings at full deployment and 0–5% cash."],
  ["Market data", "Live market information is provided through the site's configured market-data provider and may be delayed, unavailable or subject to provider limitations."],
  ["Research status", "Research is published only when it has been completed and reviewed. Empty or developing sections are intentionally not represented as completed work."],
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="font-label text-[11px] text-accent">DISCLOSURES</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Methodology &amp; disclosures</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Transparency is part of the NEEV process. This page documents what the website calculates,
          what it does not yet calculate and where users should exercise caution.
        </p>
      </header>
      <div className="space-y-3">
        {items.map(([title, text]) => (
          <section key={title} className="card p-6">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
          </section>
        ))}
      </div>
      <section className="mt-8 card p-6">
        <h2 className="font-semibold">Fund mandate</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          NEEV operates on a {FUND_CONFIG.horizonLabel} horizon, with India-only listed equity as
          its universe and {FUND_CONFIG.benchmarkName} as its governing benchmark.
        </p>
      </section>
    </div>
  );
}
