import type { Holding } from "./portfolio-db";
import { listNavHistory, type NavEntry } from "./portfolio-db";
import type { QuoteData } from "./finance-types";
import { computeFundValue } from "./fund-engine";
import { fetchCsv, findColumn, normalizeDate, parseNumber } from "./csv";

/**
 * Fetches a published Google Sheet (File -> Share -> Publish to web -> CSV) and
 * reads it as fund NAV history. Expects a header row with a "date" column and a
 * "nav" (or "value"/"total") column - column order and extra columns don't matter,
 * so the sheet can also hold the GOOGLEFINANCE() formulas that produce those totals.
 */
export async function fetchSheetNavHistory(csvUrl: string): Promise<NavEntry[]> {
  const rows = await fetchCsv(csvUrl);
  if (rows.length < 2) return [];

  const header = rows[0];
  const dateIdx = findColumn(header, "date");
  const navIdx = findColumn(header, "nav", "value", "total");
  if (dateIdx === -1 || navIdx === -1) {
    throw new Error('NAV sheet must have a "Date" column and a "NAV" (or "Value"/"Total") column.');
  }

  const entries: NavEntry[] = [];
  for (const cells of rows.slice(1)) {
    const date = normalizeDate(cells[dateIdx] ?? "");
    const nav = parseNumber(cells[navIdx]);
    if (!date || Number.isNaN(nav)) continue;
    entries.push({ id: `sheet-${date}`, date, nav, note: null });
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export interface NavTimeline {
  history: NavEntry[];
  liveValue: number;
  source: "google-sheet" | "manual" | "computed";
}

/**
 * The single source of truth for "what is the fund worth right now, and how did it
 * get here." Prefers a published Google Sheet (GOOGLEFINANCE-priced) when
 * FUND_NAV_SHEET_CSV_URL is configured, falls back to manually-logged nav_history
 * otherwise, and always appends today's value computed live from current holdings
 * so the dashboard reacts the moment a position is added, edited, or exited -
 * without waiting on either the sheet or a manual entry.
 */
export async function getNavTimeline(holdings: Holding[], quotes: QuoteData[]): Promise<NavTimeline> {
  const liveValue = computeFundValue(holdings, quotes);
  const sheetUrl = process.env.FUND_NAV_SHEET_CSV_URL;

  let history: NavEntry[];
  let source: NavTimeline["source"];

  if (sheetUrl) {
    try {
      history = await fetchSheetNavHistory(sheetUrl);
      source = "google-sheet";
    } catch {
      history = await listNavHistory();
      source = "manual";
    }
  } else {
    history = await listNavHistory();
    source = history.length > 0 ? "manual" : "computed";
  }

  const today = new Date().toISOString().slice(0, 10);
  const withoutToday = history.filter((h) => h.date !== today);
  const merged = [
    ...withoutToday,
    { id: "live-today", date: today, nav: liveValue, note: null },
  ].sort((a, b) => a.date.localeCompare(b.date));

  return { history: merged, liveValue, source };
}
