import type { Metadata } from "next";
import Link from "next/link";
import { getHoldings } from "@/lib/google-sheet-portfolio";
import { getQuotes } from "@/lib/yahoo";
import { computeFundBreakdown } from "@/lib/fund-engine";
import { FUND_CONFIG } from "@/lib/sectors";
import { formatCompact } from "@/lib/format";
import { IconShield } from "@/components/icons/FinanceIcons";

/** Plain (unsigned) percent for weight/allocation figures - formatPercent's "+" prefix reads as a gain/loss delta, not a share of NAV. */
function weightPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export const metadata: Metadata = {
  title: "Fund Charter | Finception",
  description:
    "Finception's Fund Charter - structure, position limits, deployment schedule, risk controls and governance for the student-managed model portfolio.",
};

// Live compliance figures depend on current holdings + market quotes, so this
// page renders fresh on every request rather than serving a cached copy.
export const revalidate = 0;

function LimitCard({
  label,
  current,
  limit,
  limitLabel,
  detail,
  breach,
}: {
  label: string;
  current: string;
  limit: string;
  limitLabel: string;
  detail?: string;
  breach: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${breach ? "text-down" : "text-foreground"}`}>{current}</p>
      <p className="mt-1 text-xs text-muted">{limitLabel}: {limit}</p>
      {detail && <p className="mt-2 text-xs text-muted">{detail}</p>}
      <span
        className={`mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${
          breach ? "text-down" : "text-up"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${breach ? "bg-down" : "bg-up"}`} />
        {breach ? "Over limit" : "Within charter"}
      </span>
    </div>
  );
}

export default async function FundCharterPage() {
  const holdings = await getHoldings();
  const activeHoldings = holdings.filter((h) => h.status === "active");
  const symbols = activeHoldings.map((h) => h.symbol);
  const quotes = symbols.length > 0 ? await getQuotes(symbols).catch(() => []) : [];
  const breakdown = computeFundBreakdown(holdings, quotes);

  const maxStockLimitPct = FUND_CONFIG.maxSingleStockWeight * 100;
  const maxSectorLimitPct = FUND_CONFIG.maxSingleSectorWeight * 100;
  const minCashPct = FUND_CONFIG.minCashBuffer * 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="font-label text-[11px] text-accent">Student Managed Fund</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Fund Charter</h1>
        <p className="mt-3 max-w-2xl text-muted">
          The operating and risk rules behind every portfolio decision - so each one is
          auditable against a written standard rather than discretionary.
        </p>
      </header>

      {/* Structure & Capital */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Structure &amp; Capital</h2>
        <div className="card grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted">Vehicle</p>
            <p className="mt-1 text-sm text-foreground">
              Paper/simulated portfolio (notional AUM) - no real capital deployed unless
              separately approved by the faculty mentor and institute administration.
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Notional AUM</p>
            <p className="mt-1 text-sm text-foreground">{formatCompact(FUND_CONFIG.notionalAum)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Benchmark</p>
            <p className="mt-1 text-sm text-foreground">
              {FUND_CONFIG.benchmarkName} - fixed for the full 8-month cycle
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Currency &amp; Universe</p>
            <p className="mt-1 text-sm text-foreground">
              INR-denominated, NSE/BSE-listed equities only, across the 5 mandated sectors.
            </p>
          </div>
        </div>
      </section>

      {/* Live compliance */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <IconShield className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Position &amp; Concentration Limits</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Checked live against current holdings and market prices - the same figures behind
          the fund&apos;s Current NAV.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <LimitCard
            label="Largest single-stock weight"
            current={weightPct(breakdown.maxSingleStockPct)}
            limit={`${maxStockLimitPct}% of NAV at purchase`}
            limitLabel="Charter limit"
            detail={breakdown.maxSingleStockSymbol ? `Currently ${breakdown.maxSingleStockSymbol}` : "No active holdings yet"}
            breach={breakdown.maxSingleStockPct > maxStockLimitPct}
          />
          <LimitCard
            label="Largest sector weight"
            current={weightPct(breakdown.maxSectorPct)}
            limit={`${maxSectorLimitPct}% of NAV`}
            limitLabel="Charter limit"
            detail={breakdown.maxSector ? `Currently ${breakdown.maxSector}` : "No active holdings yet"}
            breach={breakdown.maxSectorPct > maxSectorLimitPct}
          />
          <LimitCard
            label="Cash buffer"
            current={weightPct(breakdown.cashPct)}
            limit={`${minCashPct}% minimum`}
            limitLabel="Charter limit"
            breach={breakdown.cashPct < minCashPct}
          />
          <LimitCard
            label="Active names"
            current={String(breakdown.activeNames)}
            limit={`${FUND_CONFIG.minNamesAtFullDeployment} to ${FUND_CONFIG.maxNamesAtFullDeployment} at full deployment`}
            limitLabel="Target"
            detail="3 to 4 per industry once fully constructed (from September)"
            breach={false}
          />
        </div>

        {breakdown.bySector.length > 0 && (
          <div className="card mt-4 divide-y divide-border">
            {breakdown.bySector.map((s) => (
              <div key={s.sector} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-foreground">{s.sector}</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted">{formatCompact(s.value)}</span>
                  <span
                    className={`font-mono text-xs font-medium ${
                      s.weightPct > maxSectorLimitPct ? "text-down" : "text-muted"
                    }`}
                  >
                    {weightPct(s.weightPct)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Deployment schedule */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Deployment Schedule</h2>
        <div className="card divide-y divide-border">
          <div className="px-4 py-3 text-sm">
            <span className="font-mono text-xs text-accent">August</span>
            <p className="mt-1 text-muted">
              Up to 50% of notional capital deployed, based on Top-5-per-industry screening.
            </p>
          </div>
          <div className="px-4 py-3 text-sm">
            <span className="font-mono text-xs text-accent">September</span>
            <p className="mt-1 text-muted">
              Remaining capital deployed; portfolio considered &ldquo;fully constructed&rdquo; from
              this point.
            </p>
          </div>
          <div className="px-4 py-3 text-sm">
            <span className="font-mono text-xs text-accent">October to February</span>
            <p className="mt-1 text-muted">
              Rebalancing only (no new net capital deployment) - driven by each month&apos;s
              incremental evidence layer.
            </p>
          </div>
        </div>
      </section>

      {/* Risk controls */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Risk Controls</h2>
        <div className="card p-5 text-sm text-muted">
          <p>
            Any holding down 25% from cost, or missing 2 consecutive quarterly result deadlines for
            coverage, is automatically tabled for Investment Committee review.
          </p>
          <p className="mt-3">
            No leverage, no derivatives, no short positions - long-only cash equity mandate for
            the full cycle.
          </p>
        </div>
      </section>

      {/* Governance */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Decision Rights &amp; Governance</h2>
        <div className="card p-5 text-sm text-muted">
          <p>
            Every decision is logged in the{" "}
            <Link href="/portfolio/register" className="text-accent hover:underline">
              Decision Register
            </Link>
            : date, stock/sector, rationale, vote count, and dissenting views (if any) - the
            primary input to the March performance attribution.
          </p>
        </div>
      </section>

      {/* Performance measurement */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Performance Measurement</h2>
        <div className="card grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted">Reported monthly</p>
            <p className="mt-1 text-sm text-foreground">
              Absolute return, return vs. benchmark, and sector attribution.
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Reported annually (March)</p>
            <p className="mt-1 text-sm text-foreground">
              Alpha generated, hit ratio, portfolio turnover, maximum drawdown, and volatility.
            </p>
          </div>
        </div>
      </section>

      {/* Continuity */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Continuity</h2>
        <div className="card p-5 text-sm text-muted">
          <p>
            A one-page handoff memo - portfolio state, open theses, lessons learned - is
            prepared by the outgoing Core Committee in March for the incoming batch.
          </p>
          <p className="mt-3">
            The Portfolio Archive and Decision Register persist across cycles as the club&apos;s
            institutional memory.
          </p>
        </div>
      </section>
    </div>
  );
}
