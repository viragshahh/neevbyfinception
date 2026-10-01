import Link from "next/link";
import TickerTape from "@/components/finance/TickerTape";
import PerformanceChart from "@/components/portfolio/PerformanceChart";
import Reveal from "@/components/Reveal";
import FinanceBackdrop from "@/components/FinanceBackdrop";
import { HeroChartIllustration, IconArrowUpRight } from "@/components/icons/FinanceIcons";
import {
  IconMarkets,
  IconNews,
  IconPortfolio,
  IconReports,
  IconSearch,
  IconSprout,
} from "@/components/icons/FinanceIcons";
import { listAllIndustryContent } from "@/lib/portfolio-db";
import { getChart, getQuotes } from "@/lib/yahoo";
import { getNavTimeline } from "@/lib/google-sheet-nav";
import { getDecisions, getHoldings } from "@/lib/google-sheet-portfolio";
import { withLiveMetrics, totalReturnPct as computeTotalReturnPct } from "@/lib/fund-engine";
import { FUND_CONFIG, LAYERS, SECTORS } from "@/lib/sectors";
import { formatCompact, formatPercent } from "@/lib/format";

// Portfolio/decision data can come from a live Google Sheet, so this page renders
// fresh on every request rather than serving a cached copy.
export const revalidate = 0;

const FEATURES = [
  {
    href: "/portfolio",
    title: "Portfolio",
    description:
      "Our student-managed model portfolio: fund performance, holdings, sector coverage and the Investment Committee decision register.",
    icon: IconPortfolio,
  },
  {
    href: "/markets",
    title: "Live Markets",
    description:
      "Real-time NIFTY, SENSEX and Bank Nifty tracking with sector-wise market overviews, indices and global cues.",
    icon: IconMarkets,
  },
  {
    href: "/search",
    title: "Company Search",
    description:
      "Search any NSE/BSE-listed company and pull up its live chart, financials, fundamentals and technical signals.",
    icon: IconSearch,
  },
  {
    href: "/reports",
    title: "Industry Reports",
    description:
      "Sector deep-dives and monthly investment reviews published by Finception, available for viewing and download.",
    icon: IconReports,
  },
  {
    href: "/news",
    title: "Finance News",
    description:
      "A live, continuously updating feed of Indian and global financial news and market-moving headlines.",
    icon: IconNews,
  },
  {
    href: "/neev",
    title: "Neev by Finception",
    description:
      "Our outreach initiative laying the foundation of financial literacy - its mission, vision and impact.",
    icon: IconSprout,
  },
];

const STATS = [
  { label: "Active Members", value: "120+" },
  { label: "Reports Published", value: "25+" },
  { label: "Campus Sessions", value: "40+" },
  { label: "Founded", value: "2015" },
];

export default async function Home() {
  const [holdings, decisions, industryContent] = await Promise.all([
    getHoldings(),
    getDecisions(),
    listAllIndustryContent(),
  ]);

  const activeHoldings = holdings.filter((h) => h.status === "active");
  const symbols = activeHoldings.map((h) => h.symbol);
  const quotes = symbols.length > 0 ? await getQuotes(symbols).catch(() => []) : [];

  const [{ history: navHistory, liveValue }, benchmarkCandles] = await Promise.all([
    getNavTimeline(holdings, quotes),
    getChart(FUND_CONFIG.benchmarkSymbol, FUND_CONFIG.cycleStartDate, "1d").catch(() => []),
  ]);
  const totalReturnPct = computeTotalReturnPct(liveValue);

  const totalCurrentValue = withLiveMetrics(activeHoldings, quotes).reduce(
    (sum, h) => sum + h.currentValue,
    0
  );

  const coverage = SECTORS.map((s) => {
    const layersPublished = LAYERS.filter((l) =>
      industryContent.some((c) => c.sectorSlug === s.slug && c.layer === l.key)
    ).length;
    const overview = industryContent.find((c) => c.sectorSlug === s.slug && c.layer === "overview");
    return { ...s, layersPublished, blurb: overview?.content ?? null };
  });

  const recentDecisions = decisions.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-float-slow rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.35), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -right-16 top-10 h-80 w-80 animate-float-slow rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.3), transparent 70%)", animationDelay: "2s" }}
        />
        <FinanceBackdrop />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <span className="font-label animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-[11px] text-accent backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" />
              Great Lakes Institute of Management, Gurgaon
            </span>
            <h1
              className="font-display animate-fade-up mt-5 text-4xl font-semibold tracking-tight sm:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              <span className="text-gradient-accent">Finception</span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-muted"
              style={{ animationDelay: "160ms" }}
            >
              A research-driven process, built one evidence layer at a time. Finception runs a
              paper-traded, student-managed model portfolio across five sectors, with the
              discipline of an equity research desk - transparent theses, logged decisions,
              and a research base that compounds monthly.
            </p>
            <div
              className="animate-fade-up mt-6 flex flex-wrap gap-3 font-mono text-xs text-muted"
              style={{ animationDelay: "220ms" }}
            >
              <span className="rounded-md border border-border px-3 py-1.5">
                Benchmark: {FUND_CONFIG.benchmarkName}
              </span>
              <span className="rounded-md border border-border px-3 py-1.5">
                Notional AUM: {formatCompact(FUND_CONFIG.notionalAum)}
              </span>
              <span className="rounded-md border border-border px-3 py-1.5">{FUND_CONFIG.cycleLabel}</span>
            </div>
            <div
              className="animate-fade-up mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "280ms" }}
            >
              <Link
                href="/portfolio"
                className="group inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-[#070908] shadow-[0_8px_24px_-8px_rgba(34,197,94,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(34,197,94,0.65)]"
              >
                Explore the Portfolio
                <IconArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/industries"
                className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface-2"
              >
                View Industry Coverage
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="card p-6">
              <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                <span>Fund vs {FUND_CONFIG.benchmarkName}</span>
                <span className={totalReturnPct >= 0 ? "text-up" : "text-down"}>
                  {formatPercent(totalReturnPct, false)}
                </span>
              </div>
              <HeroChartIllustration className="mt-3 h-64 w-full text-border" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-3">
        <TickerTape />
      </section>

      {/* Fund snapshot */}
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="font-label text-[11px] text-accent">Fund Snapshot</p>
            <h2 className="font-display mt-1.5 text-2xl font-semibold sm:text-3xl">
              Performance at a glance
            </h2>
            <div className="mt-3 h-px w-12 bg-accent" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs text-muted">Current NAV (live)</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{formatCompact(liveValue)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-muted">Total Return</p>
              <p className={`mt-1 text-2xl font-bold ${totalReturnPct >= 0 ? "text-up" : "text-down"}`}>
                {formatPercent(totalReturnPct, false)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-muted">Deployed Capital (mkt value)</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {activeHoldings.length > 0 ? formatCompact(totalCurrentValue) : "-"}
              </p>
            </div>
          </div>

          <div className="card mt-4 p-5">
            <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">
              Fund vs {FUND_CONFIG.benchmarkName} (indexed to 100)
            </h3>
            <PerformanceChart navHistory={navHistory} benchmark={benchmarkCandles} />
          </div>
        </section>
      </Reveal>

      {/* Sector coverage */}
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="font-label text-[11px] text-accent">Coverage</p>
            <h2 className="font-display mt-1.5 text-2xl font-semibold sm:text-3xl">
              Five mandated sectors
            </h2>
            <div className="mt-3 h-px w-12 bg-accent" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coverage.map((s) => (
              <Link
                key={s.slug}
                href={`/industries/${s.slug}`}
                className="card card-hover group flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-medium text-foreground group-hover:text-accent">
                    {s.name}
                  </h3>
                  <span className="shrink-0 font-mono text-[10px] text-muted">
                    {s.layersPublished}/{LAYERS.length} layers
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {s.blurb ?? "Coverage not yet published for this sector."}
                </p>
                <div className="mt-4 flex gap-1">
                  {LAYERS.map((l, i) => (
                    <span
                      key={l.key}
                      className={`h-1 flex-1 rounded-full ${
                        i < s.layersPublished ? "bg-accent" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Decision register preview */}
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-label text-[11px] text-accent">Decision Register</p>
              <h2 className="font-display mt-1.5 text-2xl font-semibold sm:text-3xl">
                Most recent IC decisions
              </h2>
            </div>
            <Link
              href="/portfolio/register"
              className="hidden shrink-0 font-mono text-xs text-accent hover:text-foreground sm:inline"
            >
              View full register &rarr;
            </Link>
          </div>

          {recentDecisions.length === 0 ? (
            <div className="card p-6 text-sm text-muted">No decisions logged yet.</div>
          ) : (
            <div className="card divide-y divide-border">
              {recentDecisions.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
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
                  <span className="min-w-0 sm:min-w-[200px] flex-1 text-muted break-words">{d.rationale}</span>
                  {d.voteCount && <span className="shrink-0 font-mono text-xs text-muted">{d.voteCount}</span>}
                </div>
              ))}
            </div>
          )}
          <Link
            href="/portfolio/register"
            className="mt-4 inline-block font-mono text-xs text-accent hover:text-foreground sm:hidden"
          >
            View full register &rarr;
          </Link>
        </section>
      </Reveal>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-6 text-center transition-colors hover:bg-surface-2">
              <p className="text-gradient-accent text-3xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            What you&apos;ll find here
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Everything Finception offers to the GLIM Gurgaon community, in one place.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="card card-hover group flex flex-col gap-3 p-6"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2 text-accent transition-colors group-hover:border-accent/40">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-accent">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted">{feature.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                    Explore &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* Closing CTA */}
      <section className="hairline-top mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="font-label text-[11px] text-accent">Join the Core Committee</p>
        <h2 className="font-display mx-auto mt-2 max-w-xl text-2xl font-semibold sm:text-3xl">
          Interested in equity research at GLIM Gurgaon?
        </h2>
      </section>
    </div>
  );
}
