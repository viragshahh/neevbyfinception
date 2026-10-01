import type { Holding } from "./portfolio-db";
import type { QuoteData } from "./finance-types";
import { FUND_CONFIG } from "./sectors";

function quoteFor(symbol: string, quotes: QuoteData[]) {
  return quotes.find((x) => x.symbol === symbol);
}

/**
 * Transitional valuation using the current holding ledger.
 * Historical cost of exited positions is removed from cash before sale
 * proceeds are returned. This prevents sale proceeds being double counted.
 */
export function computeFundValue(holdings: Holding[], quotes: QuoteData[]): number {
  const active = holdings.filter((h) => h.status === "active");
  const historicalCost = holdings.reduce((sum, h) => sum + h.avgCost * h.quantity, 0);
  const realizedProceeds = holdings
    .filter((h) => h.status === "exited")
    .reduce((sum, h) => sum + (h.exitPrice ?? h.avgCost) * h.quantity, 0);

  const cash = FUND_CONFIG.notionalAum - historicalCost + realizedProceeds;
  const marketValueActive = active.reduce((sum, h) => {
    const quote = quoteFor(h.symbol, quotes);
    return sum + (quote?.price ?? h.avgCost) * h.quantity;
  }, 0);

  return cash + marketValueActive;
}

export interface HoldingWithLive extends Holding {
  ltp: number | null;
  currentValue: number;
  costValue: number;
  pnlPct: number | null;
  quoteAvailable: boolean;
}

export function withLiveMetrics(holdings: Holding[], quotes: QuoteData[]): HoldingWithLive[] {
  return holdings.map((h) => {
    const ltp = quoteFor(h.symbol, quotes)?.price ?? null;
    const costValue = h.avgCost * h.quantity;
    const currentValue = ltp !== null ? ltp * h.quantity : costValue;
    const pnlPct = ltp !== null ? ((ltp - h.avgCost) / h.avgCost) * 100 : null;
    return { ...h, ltp, currentValue, costValue, pnlPct, quoteAvailable: ltp !== null };
  });
}

export function totalReturnPct(currentValue: number): number {
  return ((currentValue - FUND_CONFIG.notionalAum) / FUND_CONFIG.notionalAum) * 100;
}

export interface FundBreakdown {
  totalValue: number;
  cash: number;
  holdingsValue: number;
  cashPct: number;
  activeNames: number;
  maxSingleStockPct: number;
  maxSingleStockSymbol: string | null;
  maxSectorPct: number;
  maxSector: string | null;
  bySector: { sector: string; value: number; weightPct: number }[];
  missingQuoteSymbols: string[];
}

export function computeFundBreakdown(holdings: Holding[], quotes: QuoteData[]): FundBreakdown {
  const active = withLiveMetrics(holdings.filter((h) => h.status === "active"), quotes);
  const totalValue = computeFundValue(holdings, quotes);
  const holdingsValue = active.reduce((sum, h) => sum + h.currentValue, 0);
  const cash = totalValue - holdingsValue;

  const sectorTotals = new Map<string, number>();
  active.forEach((h) => {
    sectorTotals.set(h.sector, (sectorTotals.get(h.sector) ?? 0) + h.currentValue);
  });

  const bySector = Array.from(sectorTotals.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      weightPct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.weightPct - a.weightPct);

  const topStock = active.reduce<HoldingWithLive | null>(
    (max, h) => (max === null || h.currentValue > max.currentValue ? h : max),
    null
  );

  return {
    totalValue,
    cash,
    holdingsValue,
    cashPct: totalValue > 0 ? (cash / totalValue) * 100 : 100,
    activeNames: active.length,
    maxSingleStockPct: totalValue > 0 && topStock ? (topStock.currentValue / totalValue) * 100 : 0,
    maxSingleStockSymbol: topStock?.symbol ?? null,
    maxSectorPct: bySector[0]?.weightPct ?? 0,
    maxSector: bySector[0]?.sector ?? null,
    bySector,
    missingQuoteSymbols: active.filter((h) => !h.quoteAvailable).map((h) => h.symbol),
  };
}

export interface CharterStatus {
  holdings: { current: number; min: number; max: number; status: "within" | "below" | "above" };
  initialPosition: { limitPct: number };
  singleStock: { currentPct: number; limitPct: number; status: "within" | "above" };
  sector: { currentPct: number; limitPct: number; status: "within" | "above" };
  cash: { currentPct: number; minPct: number; maxPct: number; status: "within" | "below" | "above" };
  leverage: { cash: number; status: "within" | "breach" };
}

export function computeCharterStatus(breakdown: FundBreakdown): CharterStatus {
  const holdingsStatus =
    breakdown.activeNames < FUND_CONFIG.minNamesAtFullDeployment
      ? "below"
      : breakdown.activeNames > FUND_CONFIG.maxNamesAtFullDeployment
        ? "above"
        : "within";

  return {
    holdings: {
      current: breakdown.activeNames,
      min: FUND_CONFIG.minNamesAtFullDeployment,
      max: FUND_CONFIG.maxNamesAtFullDeployment,
      status: holdingsStatus,
    },
    initialPosition: { limitPct: FUND_CONFIG.maxInitialPositionWeight * 100 },
    singleStock: {
      currentPct: breakdown.maxSingleStockPct,
      limitPct: FUND_CONFIG.maxSingleStockWeight * 100,
      status: breakdown.maxSingleStockPct > FUND_CONFIG.maxSingleStockWeight * 100 ? "above" : "within",
    },
    sector: {
      currentPct: breakdown.maxSectorPct,
      limitPct: FUND_CONFIG.maxSingleSectorWeight * 100,
      status: breakdown.maxSectorPct > FUND_CONFIG.maxSingleSectorWeight * 100 ? "above" : "within",
    },
    cash: {
      currentPct: breakdown.cashPct,
      minPct: FUND_CONFIG.minCashBuffer * 100,
      maxPct: FUND_CONFIG.maxCashBuffer * 100,
      status:
        breakdown.cashPct < FUND_CONFIG.minCashBuffer * 100
          ? "below"
          : breakdown.cashPct > FUND_CONFIG.maxCashBuffer * 100
            ? "above"
            : "within",
    },
    leverage: {
      cash: breakdown.cash,
      status: breakdown.cash < -0.01 ? "breach" : "within",
    },
  };
}
