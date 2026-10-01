import type { Holding } from "./portfolio-db";
import type { QuoteData } from "./finance-types";
import { FUND_CONFIG } from "./sectors";

/**
 * Live fund value, computed straight from holdings + current quotes — no manual NAV
 * entry required. Adding, exiting, or repricing a holding changes this number on the
 * next render. Cash = notional AUM minus what's tied up in active positions plus
 * proceeds already banked from exited ones; total value = cash + current market
 * value of everything still held.
 */
export function computeFundValue(holdings: Holding[], quotes: QuoteData[]): number {
  const active = holdings.filter((h) => h.status === "active");
  const exited = holdings.filter((h) => h.status === "exited");

  const costOfActive = active.reduce((sum, h) => sum + h.avgCost * h.quantity, 0);
  const proceedsOfExited = exited.reduce(
    (sum, h) => sum + (h.exitPrice ?? h.avgCost) * h.quantity,
    0
  );
  const cash = FUND_CONFIG.notionalAum - costOfActive + proceedsOfExited;

  const marketValueActive = active.reduce((sum, h) => {
    const q = quotes.find((x) => x.symbol === h.symbol);
    const ltp = q?.price ?? h.avgCost;
    return sum + (ltp ?? h.avgCost) * h.quantity;
  }, 0);

  return cash + marketValueActive;
}

export interface HoldingWithLive extends Holding {
  ltp: number | null;
  currentValue: number;
  costValue: number;
  pnlPct: number | null;
}

export function withLiveMetrics(holdings: Holding[], quotes: QuoteData[]): HoldingWithLive[] {
  return holdings.map((h) => {
    const q = quotes.find((x) => x.symbol === h.symbol);
    const ltp = q?.price ?? null;
    const costValue = h.avgCost * h.quantity;
    const currentValue = ltp !== null ? ltp * h.quantity : costValue;
    const pnlPct = ltp !== null ? ((ltp - h.avgCost) / h.avgCost) * 100 : null;
    return { ...h, ltp, currentValue, costValue, pnlPct };
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
}

/**
 * Live snapshot of the fund against the Fund Charter's own position and
 * concentration limits (max 10% per stock, max 30% per sector, min 5% cash),
 * computed straight from current holdings + market quotes — the same live
 * numbers behind Current NAV, just broken down by stock and sector.
 */
export function computeFundBreakdown(holdings: Holding[], quotes: QuoteData[]): FundBreakdown {
  const active = withLiveMetrics(holdings.filter((h) => h.status === "active"), quotes);
  const totalValue = computeFundValue(holdings, quotes);
  const holdingsValue = active.reduce((sum, h) => sum + h.currentValue, 0);
  const cash = totalValue - holdingsValue;

  const weighted = active.map((h) => ({
    symbol: h.symbol,
    sector: h.sector,
    weightPct: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
  }));

  const sectorTotals = new Map<string, number>();
  active.forEach((h) => sectorTotals.set(h.sector, (sectorTotals.get(h.sector) ?? 0) + h.currentValue));
  const bySector = Array.from(sectorTotals.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      weightPct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.weightPct - a.weightPct);

  const topStock = weighted.reduce<{ symbol: string; weightPct: number } | null>(
    (max, h) => (max === null || h.weightPct > max.weightPct ? h : max),
    null
  );

  return {
    totalValue,
    cash,
    holdingsValue,
    cashPct: totalValue > 0 ? (cash / totalValue) * 100 : 100,
    activeNames: active.length,
    maxSingleStockPct: topStock?.weightPct ?? 0,
    maxSingleStockSymbol: topStock?.symbol ?? null,
    maxSectorPct: bySector[0]?.weightPct ?? 0,
    maxSector: bySector[0]?.sector ?? null,
    bySector,
  };
}
