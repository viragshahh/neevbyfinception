import { fetchCsv, findColumn, findColumnExcluding, findHeaderRow, normalizeDate, parseNumber } from "./csv";
import {
  listHoldings as listSupabaseHoldings,
  listDecisions as listSupabaseDecisions,
  type Decision,
  type Holding,
} from "./portfolio-db";

const SYMBOL_KEYWORDS = ["symbol", "ticker"];
const SECTOR_KEYWORDS = ["sector"];
const QUANTITY_KEYWORDS = ["quantity", "qty", "shares"];
const AVG_COST_KEYWORDS = [
  "avg cost",
  "avg. cost",
  "average cost",
  "avgcost",
  "buy price",
  "purchase price",
  "cost price",
  "cost/share",
  "per share cost",
];

/**
 * Finds the per-share cost column, deliberately preferring specific phrasings
 * ("Buy Price", "Avg Cost", ...) before falling back to a bare "cost" keyword
 * - and even then refusing any header that also says "basis" or "total", since
 * a "Cost Basis" or "Total Cost" column holds the whole position's cost, not
 * the per-share figure, and would otherwise inflate every computed value.
 */
function findAvgCostColumn(header: string[]): number {
  const specific = findColumn(header, ...AVG_COST_KEYWORDS);
  if (specific !== -1) return specific;
  return findColumnExcluding(header, "cost", ["basis", "total"]);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reads the "Holdings" tab of the shared portfolio Google Sheet (published as
 * CSV). Tolerant of real-world sheet quirks: a title/blank row above the real
 * header, column-name synonyms (Ticker/Symbol, Buy Price/Avg Cost, ...), and
 * missing optional columns (Company Name, Entry Date, Status default sensibly).
 * Only Symbol, Sector, Quantity and an avg-cost column must be identifiable -
 * everything else is best-effort.
 */
export async function fetchSheetHoldings(csvUrl: string): Promise<Holding[]> {
  const rows = await fetchCsv(csvUrl);
  if (rows.length < 2) return [];

  const headerIdx = findHeaderRow(
    rows,
    [
      (h) => findColumn(h, ...SYMBOL_KEYWORDS) !== -1,
      (h) => findColumn(h, ...QUANTITY_KEYWORDS) !== -1,
      (h) => findAvgCostColumn(h) !== -1,
    ],
    2
  );
  const header = rows[headerIdx];

  const symbolIdx = findColumn(header, ...SYMBOL_KEYWORDS);
  const nameIdx = findColumn(header, "company", "name");
  const sectorIdx = findColumn(header, ...SECTOR_KEYWORDS);
  const quantityIdx = findColumn(header, ...QUANTITY_KEYWORDS);
  const avgCostIdx = findAvgCostColumn(header);
  const entryDateIdx = findColumn(header, "entry date", "entry", "buy date", "purchase date", "date");
  const statusIdx = findColumn(header, "status");
  const exitDateIdx = findColumn(header, "exit date", "sell date");
  const exitPriceIdx = findColumn(header, "exit price", "sell price");

  if (symbolIdx === -1 || quantityIdx === -1 || avgCostIdx === -1) {
    throw new Error(
      'Could not find "Symbol"/"Ticker", "Quantity" and a per-share cost column ("Avg Cost" or "Buy Price") in the Holdings sheet.'
    );
  }

  const today = todayIso();
  const holdings: Holding[] = [];
  for (const cells of rows.slice(headerIdx + 1)) {
    const symbol = (cells[symbolIdx] ?? "").trim().toUpperCase();
    const quantity = parseNumber(cells[quantityIdx]);
    const avgCost = parseNumber(cells[avgCostIdx]);
    if (!symbol || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(avgCost) || avgCost <= 0) {
      continue;
    }

    const entryDate = (entryDateIdx !== -1 ? normalizeDate(cells[entryDateIdx] ?? "") : null) ?? today;
    const status = (cells[statusIdx] ?? "").trim().toLowerCase() === "exited" ? "exited" : "active";
    const exitDate = exitDateIdx !== -1 ? normalizeDate(cells[exitDateIdx] ?? "") : null;
    const exitPrice = exitPriceIdx !== -1 ? parseNumber(cells[exitPriceIdx]) : NaN;

    holdings.push({
      id: `sheet-${symbol}-${entryDate}`,
      symbol,
      companyName: (nameIdx !== -1 ? cells[nameIdx] : "")?.trim() || symbol,
      sector: (sectorIdx !== -1 ? cells[sectorIdx] : "")?.trim() || "Unclassified",
      quantity,
      avgCost,
      entryDate,
      status,
      exitDate: status === "exited" ? exitDate : null,
      exitPrice: status === "exited" && Number.isFinite(exitPrice) ? exitPrice : null,
    });
  }

  return holdings;
}

/** Maps loose real-world decision wording onto the fund's BUY/HOLD/SELL model. */
function normalizeDecision(raw: string): Decision["decision"] | null {
  const v = raw.trim().toUpperCase();
  if (!v) return null;
  if (v.includes("BUY") || v.includes("ADD")) return "BUY";
  if (v.includes("SELL") || v.includes("TRIM") || v.includes("REDUCE") || v.includes("EXIT")) return "SELL";
  if (v.includes("HOLD")) return "HOLD";
  return null;
}

/**
 * Reads the "Decisions" tab of the shared portfolio Google Sheet (published as
 * CSV) as the Investment Committee Decision Register. Tolerant of the same
 * kind of real-world quirks as fetchSheetHoldings: a title row above the
 * header, a missing Date column (defaults every row to today), decision
 * wording beyond a strict BUY/HOLD/SELL (e.g. "TRIM" -> SELL, "HOLD (Watch)"
 * -> HOLD), and trailing summary rows below the data (skipped automatically
 * since they won't have a recognizable decision value in the Decision column).
 */
export async function fetchSheetDecisions(csvUrl: string): Promise<Decision[]> {
  const rows = await fetchCsv(csvUrl);
  if (rows.length < 2) return [];

  const headerIdx = findHeaderRow(
    rows,
    [
      (h) => findColumn(h, "decision") !== -1,
      (h) => findColumn(h, ...SECTOR_KEYWORDS) !== -1,
      (h) => findColumn(h, ...SYMBOL_KEYWORDS) !== -1,
    ],
    2
  );
  const header = rows[headerIdx];

  const dateIdx = findColumn(header, "date");
  const sectorIdx = findColumn(header, ...SECTOR_KEYWORDS);
  const nameIdx = findColumn(header, "company", "name");
  const symbolIdx = findColumn(header, ...SYMBOL_KEYWORDS);
  const decisionIdx = findColumn(header, "decision");
  const rationaleIdx = findColumn(header, "rationale", "notes", "reason", "comment");
  const voteIdx = findColumn(header, "vote");

  if (decisionIdx === -1 || (sectorIdx === -1 && symbolIdx === -1)) {
    throw new Error('Could not find a "Decision" column and a "Sector" or "Symbol" column in the Decisions sheet.');
  }

  const today = todayIso();
  const decisions: Decision[] = [];
  for (const cells of rows.slice(headerIdx + 1)) {
    const decision = normalizeDecision(cells[decisionIdx] ?? "");
    const sector = (sectorIdx !== -1 ? cells[sectorIdx] : "")?.trim() || "";
    const symbol = (symbolIdx !== -1 ? cells[symbolIdx] : "")?.trim().toUpperCase() || "";
    if (!decision || (!sector && !symbol)) continue;

    const date = (dateIdx !== -1 ? normalizeDate(cells[dateIdx] ?? "") : null) ?? today;

    decisions.push({
      id: `sheet-${date}-${decisions.length}`,
      date,
      sector: sector || "Unclassified",
      companyName: (nameIdx !== -1 ? cells[nameIdx] : "")?.trim() || null,
      symbol: symbol || null,
      decision,
      rationale: (rationaleIdx !== -1 ? cells[rationaleIdx] : "")?.trim() || "",
      voteCount: (voteIdx !== -1 ? cells[voteIdx] : "")?.trim() || null,
    });
  }

  return decisions.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Holdings for the whole site: the "Holdings" sheet tab when
 * PORTFOLIO_HOLDINGS_SHEET_CSV_URL is configured, falling back to the
 * Supabase-logged holdings (from /portfolio/admin) otherwise.
 */
export async function getHoldings(): Promise<Holding[]> {
  const sheetUrl = process.env.PORTFOLIO_HOLDINGS_SHEET_CSV_URL;
  if (sheetUrl) {
    try {
      return await fetchSheetHoldings(sheetUrl);
    } catch {
      // fall through to Supabase
    }
  }
  return listSupabaseHoldings();
}

/**
 * Decision Register for the whole site: the "Decisions" sheet tab when
 * PORTFOLIO_DECISIONS_SHEET_CSV_URL is configured, falling back to the
 * Supabase-logged decisions (from /portfolio/admin) otherwise.
 */
export async function getDecisions(): Promise<Decision[]> {
  const sheetUrl = process.env.PORTFOLIO_DECISIONS_SHEET_CSV_URL;
  if (sheetUrl) {
    try {
      return await fetchSheetDecisions(sheetUrl);
    } catch {
      // fall through to Supabase
    }
  }
  return listSupabaseDecisions();
}
