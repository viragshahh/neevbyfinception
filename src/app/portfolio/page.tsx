import type { Metadata } from "next";
import Link from "next/link";
import { getChart, getQuotes } from "@/lib/yahoo";
import { getNavTimeline } from "@/lib/google-sheet-nav";
import { getDecisions, getHoldings } from "@/lib/google-sheet-portfolio";
import { withLiveMetrics, totalReturnPct as computeTotalReturnPct } from "@/lib/fund-engine";
import { FUND_CONFIG, SECTORS } from "@/lib/sectors";
import { formatCompact, formatPercent, formatPrice, formatSigned } from "@/lib/format";
import PerformanceChart from "@/components/portfolio/PerformanceChart";

export const metadata: Metadata = {
  title: "Portfolio | Finception",
  description:
    "Finception's student-managed model portfolio: fund performance, holdings, sector coverage and the Investment Committee decision register.",
};

// Holdings/decisions/NAV can come from a live Google Sheet, so this page renders
// fresh on every request rather than serving a cached copy.
export const revalidate = 0;

export default async function PortfolioPage() {
  const [holdings, decisions] = await Promise.all([getHoldings(), getDecisions()]);

  const activeHoldings = holdings.filter((h) => h.status === "active");
  const symbols = activeHoldings.map((h) => h.symbol);
  const quotes = symbols.length > 0 ? await getQuotes(symbols).catch(() => []) : [];

  const [{ history: navHistory, liveValue }, benchmarkCandles] = await Promise.all([
    getNavTimeline(holdings, quotes),
    getChart(FUND_CONFIG.benchmarkSymbol, FUND_CONFIG.cycleStartDate, "1d").catch(() => []),
  ]);
  const totalReturn = computeTotalReturnPct(liveValue);

  const holdingsWithLive = withLiveMetrics(activeHoldings, quotes);
  const totalCurrentValue = holdingsWithLive.reduce((sum, h) => sum + h.currentValue, 0);

  const recentDecisions = decisions.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-label text-[11px] text-accent">STUDENT MANAGED FUND</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Portfolio</h1>
        <p className="mt-3 max-w-2xl text-muted">
          A student-managed Indian equity portfolio governed by a documented investment mandate,
          fundamental research, valuation discipline, portfolio risk management and Investment
          Committee oversight. NEEV is designed for long-term capital appreciation over a 3–5 year
          investment horizon.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs text-muted">
          <span className="rounded-md border border-border px-3 py-1.5">
            Benchmark: {FUND_CONFIG.benchmarkName}
          </span>
          <span className="rounded-md border border-border px-3 py-1.5">
            Notional AUM: {formatCompact(FUND_CONFIG.notionalAum)}
          </span>
          <span className="rounded-md border border-border px-3 py-1.5">{FUND_CONFIG.cycleLabel}</span>
        </div>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-muted">Current NAV (live)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatCompact(liveValue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-muted">Total Return</p>
          <p className={`mt-1 text-2xl font-bold ${totalReturn >= 0 ? "text-up" : "text-down"}`}>
            {formatPercent(totalReturn, false)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-muted">Deployed Capital (mkt value)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {activeHoldings.length > 0 ? formatCompact(totalCurrentValue) : "-"}
          </p>
        </div>
      </section>

      <section className="mb-10 card p-5">
        <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">
          Fund vs {FUND_CONFIG.benchmarkName} (indexed to 100)
        </h2>
        <PerformanceChart navHistory={navHistory} benchmark={benchmarkCandles} />
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-foreground">Five mandated sectors</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECTORS.map((s) => (
            <Link
              key={s.slug}
              href={`/industries/${s.slug}`}
              className="card group flex flex-col p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium text-foreground group-hover:text-accent">
                  {s.name}
                </h3>
              </div>
              <p className="mt-2 text-sm text-muted">
                Research and investment insights will be published here as sector work is completed.
              </p>
            </Link>
          ))}
        </div>
      </section>

      {holdingsWithLive.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Current Holdings</h2>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Sector</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Cost</th>
                  <th className="px-4 py-3 font-medium text-right">LTP</th>
                  <th className="px-4 py-3 font-medium text-right">P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holdingsWithLive.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{h.companyName}</p>
                      <p className="font-mono text-xs text-muted">{h.symbol}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{h.sector}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatPrice(h.avgCost)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {h.ltp !== null ? formatPrice(h.ltp) : "-"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        h.pnlPct === null ? "text-muted" : h.pnlPct >= 0 ? "text-up" : "text-down"
                      }`}
                    >
                      {h.pnlPct !== null ? formatSigned(h.pnlPct) + "%" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent IC Decisions</h2>
          <Link href="/portfolio/register" className="text-sm text-accent hover:underline">
            View full decision register &rarr;
          </Link>
        </div>
        {recentDecisions.length === 0 ? (
          <div className="card p-6 text-sm text-muted">No decisions logged yet.</div>
        ) : (
          <div className="card divide-y divide-border">
            {recentDecisions.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span className="w-24 shrink-0 font-mono text-xs text-muted">{d.date}</span>
                <span
                  className={`w-14 shrink-0 font-mono text-xs font-medium ${
                    d.decision === "BUY" ? "text-up" : d.decision === "SELL" ? "text-down" : "text-muted"
                  }`}
                >
                  {d.decision}
                </span>
                <span className="w-32 shrink-0 truncate font-medium text-foreground">
                  {d.companyName ?? d.sector}
                </span>
                <span className="min-w-[200px] flex-1 text-muted">{d.rationale}</span>
                {d.voteCount && (
                  <span className="shrink-0 font-mono text-xs text-muted">{d.voteCount}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
