import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import type {
  CandlePoint,
  CompanyProfile,
  FinancialHighlights,
  QuoteData,
  SearchResult,
} from "./finance-types";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function str(obj: object, key: string): string | null {
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function num(obj: object, key: string): number | null {
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "number" ? v : null;
}

function toQuoteData(q: object): QuoteData {
  const symbol = str(q, "symbol") ?? "";
  return {
    symbol,
    name: str(q, "shortName") ?? str(q, "longName") ?? symbol,
    price: num(q, "regularMarketPrice"),
    previousClose: num(q, "regularMarketPreviousClose"),
    change: num(q, "regularMarketChange"),
    changePercent: num(q, "regularMarketChangePercent"),
    dayHigh: num(q, "regularMarketDayHigh"),
    dayLow: num(q, "regularMarketDayLow"),
    open: num(q, "regularMarketOpen"),
    volume: num(q, "regularMarketVolume"),
    marketCap: num(q, "marketCap"),
    fiftyTwoWeekHigh: num(q, "fiftyTwoWeekHigh"),
    fiftyTwoWeekLow: num(q, "fiftyTwoWeekLow"),
    currency: str(q, "currency"),
    marketState: str(q, "marketState"),
  };
}

// Quotes/charts are cached briefly (30s) — plenty fresh for display purposes,
// but it means back-to-back page loads (or several visitors at once) reuse the
// same live Yahoo fetch instead of each one blocking on its own round trip.
export const getQuotes = unstable_cache(
  async (symbols: string[]): Promise<QuoteData[]> => {
    if (symbols.length === 0) return [];
    const results = await yf.quote(symbols);
    return results.map(toQuoteData);
  },
  ["yahoo-quotes"],
  { revalidate: 30 }
);

export async function getQuote(symbol: string): Promise<QuoteData | null> {
  const [q] = await getQuotes([symbol]);
  return q ?? null;
}

export const getChart = unstable_cache(
  async (
    symbol: string,
    period1: string,
    interval: "5m" | "15m" | "60m" | "1d" | "1wk" | "1mo" = "1d"
  ): Promise<CandlePoint[]> => {
    const result = await yf.chart(symbol, { period1, interval });
    return result.quotes
      .filter((c) => c.close != null)
      .map((c) => ({
        time: new Date(c.date).toISOString(),
        open: c.open ?? c.close!,
        high: c.high ?? c.close!,
        low: c.low ?? c.close!,
        close: c.close!,
        volume: c.volume ?? 0,
      }));
  },
  ["yahoo-chart"],
  { revalidate: 30 }
);

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const summary = await yf.quoteSummary(symbol, { modules: ["assetProfile"] });
  const p = summary.assetProfile;
  if (!p) return null;
  return {
    sector: p.sector ?? null,
    industry: p.industry ?? null,
    description: p.longBusinessSummary ?? null,
    website: p.website ?? null,
    employees: p.fullTimeEmployees ?? null,
    city: p.city ?? null,
    country: p.country ?? null,
  };
}

export async function getFinancialHighlights(
  symbol: string
): Promise<FinancialHighlights | null> {
  const summary = await yf.quoteSummary(symbol, {
    modules: ["summaryDetail", "financialData", "defaultKeyStatistics", "price"],
  });
  if (!summary.price) return null;
  return {
    marketCap: summary.price.marketCap ?? null,
    peRatio: summary.summaryDetail?.trailingPE ?? null,
    forwardPE: summary.summaryDetail?.forwardPE ?? null,
    eps: summary.defaultKeyStatistics?.trailingEps ?? null,
    dividendYield: summary.summaryDetail?.dividendYield ?? null,
    profitMargin: summary.financialData?.profitMargins ?? null,
    revenue: summary.financialData?.totalRevenue ?? null,
    revenueGrowth: summary.financialData?.revenueGrowth ?? null,
    returnOnEquity: summary.financialData?.returnOnEquity ?? null,
    debtToEquity: summary.financialData?.debtToEquity ?? null,
    beta: summary.summaryDetail?.beta ?? null,
  };
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await yf.search(query, { quotesCount: 8, newsCount: 0 });
  return res.quotes
    .map((q) => str(q, "symbol"))
    .map((symbol, i) => {
      if (!symbol) return null;
      const q = res.quotes[i];
      return {
        symbol,
        name: str(q, "shortname") ?? str(q, "longname") ?? symbol,
        exchange: str(q, "exchDisp") ?? str(q, "exchange") ?? "",
        type: str(q, "quoteType") ?? "",
      };
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => {
      const rank = (s: string) => (s.endsWith(".NS") ? 0 : s.endsWith(".BO") ? 1 : 2);
      return rank(a.symbol) - rank(b.symbol);
    });
}
