import { randomUUID } from "crypto";
import { supabase } from "./supabase";

export interface NavEntry {
  id: string;
  date: string;
  nav: number;
  note: string | null;
}

export interface Holding {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  quantity: number;
  avgCost: number;
  entryDate: string;
  status: "active" | "exited";
  exitDate: string | null;
  exitPrice: number | null;
}

export interface Decision {
  id: string;
  date: string;
  sector: string;
  companyName: string | null;
  symbol: string | null;
  decision: "BUY" | "HOLD" | "SELL";
  rationale: string;
  voteCount: string | null;
}

export interface IndustryContentEntry {
  sectorSlug: string;
  layer: string;
  title: string;
  content: string;
  updatedAt: string;
}

function mapNav(row: {
  id: string;
  date: string;
  nav: number;
  note: string | null;
}): NavEntry {
  return { id: row.id, date: row.date, nav: row.nav, note: row.note };
}

export async function listNavHistory(): Promise<NavEntry[]> {
  const { data, error } = await supabase
    .from("nav_history")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw new Error(`Failed to list NAV history: ${error.message}`);
  return (data ?? []).map(mapNav);
}

export async function addNavEntry(input: {
  date: string;
  nav: number;
  note?: string;
}): Promise<NavEntry> {
  const row = { id: randomUUID(), date: input.date, nav: input.nav, note: input.note ?? null };
  const { data, error } = await supabase
    .from("nav_history")
    .upsert(row, { onConflict: "date" })
    .select()
    .single();
  if (error) throw new Error(`Failed to save NAV entry: ${error.message}`);
  return mapNav(data);
}

function mapHolding(row: {
  id: string;
  symbol: string;
  company_name: string;
  sector: string;
  quantity: number;
  avg_cost: number;
  entry_date: string;
  status: string;
  exit_date: string | null;
  exit_price: number | null;
}): Holding {
  return {
    id: row.id,
    symbol: row.symbol,
    companyName: row.company_name,
    sector: row.sector,
    quantity: row.quantity,
    avgCost: row.avg_cost,
    entryDate: row.entry_date,
    status: row.status as "active" | "exited",
    exitDate: row.exit_date,
    exitPrice: row.exit_price,
  };
}

export async function listHoldings(): Promise<Holding[]> {
  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .order("entry_date", { ascending: false });
  if (error) throw new Error(`Failed to list holdings: ${error.message}`);
  return (data ?? []).map(mapHolding);
}

export async function addHolding(
  input: Omit<Holding, "id" | "status" | "exitDate" | "exitPrice">
): Promise<Holding> {
  const row = {
    id: randomUUID(),
    symbol: input.symbol,
    company_name: input.companyName,
    sector: input.sector,
    quantity: input.quantity,
    avg_cost: input.avgCost,
    entry_date: input.entryDate,
    status: "active",
  };
  const { data, error } = await supabase.from("holdings").insert(row).select().single();
  if (error) throw new Error(`Failed to add holding: ${error.message}`);
  return mapHolding(data);
}

export async function exitHolding(
  id: string,
  exitDate: string,
  exitPrice: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("holdings")
    .update({ status: "exited", exit_date: exitDate, exit_price: exitPrice })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Failed to exit holding: ${error.message}`);
  return !!data;
}

export async function deleteHolding(id: string): Promise<void> {
  const { error } = await supabase.from("holdings").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete holding: ${error.message}`);
}

function mapDecision(row: {
  id: string;
  date: string;
  sector: string;
  company_name: string | null;
  symbol: string | null;
  decision: string;
  rationale: string;
  vote_count: string | null;
}): Decision {
  return {
    id: row.id,
    date: row.date,
    sector: row.sector,
    companyName: row.company_name,
    symbol: row.symbol,
    decision: row.decision as "BUY" | "HOLD" | "SELL",
    rationale: row.rationale,
    voteCount: row.vote_count,
  };
}

export async function listDecisions(): Promise<Decision[]> {
  const { data, error } = await supabase
    .from("decisions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list decisions: ${error.message}`);
  return (data ?? []).map(mapDecision);
}

export async function addDecision(input: Omit<Decision, "id">): Promise<Decision> {
  const row = {
    id: randomUUID(),
    date: input.date,
    sector: input.sector,
    company_name: input.companyName,
    symbol: input.symbol,
    decision: input.decision,
    rationale: input.rationale,
    vote_count: input.voteCount,
  };
  const { data, error } = await supabase.from("decisions").insert(row).select().single();
  if (error) throw new Error(`Failed to save decision: ${error.message}`);
  return mapDecision(data);
}

export async function deleteDecision(id: string): Promise<void> {
  const { error } = await supabase.from("decisions").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete decision: ${error.message}`);
}

function mapIndustryContent(row: {
  sector_slug: string;
  layer: string;
  title: string;
  content: string;
  updated_at: string;
}): IndustryContentEntry {
  return {
    sectorSlug: row.sector_slug,
    layer: row.layer,
    title: row.title,
    content: row.content,
    updatedAt: row.updated_at,
  };
}

export async function listIndustryContent(sectorSlug: string): Promise<IndustryContentEntry[]> {
  const { data, error } = await supabase
    .from("industry_content")
    .select("*")
    .eq("sector_slug", sectorSlug);
  if (error) throw new Error(`Failed to load industry content: ${error.message}`);
  return (data ?? []).map(mapIndustryContent);
}

export async function listAllIndustryContent(): Promise<IndustryContentEntry[]> {
  const { data, error } = await supabase.from("industry_content").select("*");
  if (error) throw new Error(`Failed to load industry content: ${error.message}`);
  return (data ?? []).map(mapIndustryContent);
}

export async function upsertIndustryContent(input: {
  sectorSlug: string;
  layer: string;
  title: string;
  content: string;
}): Promise<IndustryContentEntry> {
  const row = {
    id: randomUUID(),
    sector_slug: input.sectorSlug,
    layer: input.layer,
    title: input.title,
    content: input.content,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("industry_content")
    .upsert(row, { onConflict: "sector_slug,layer" })
    .select()
    .single();
  if (error) throw new Error(`Failed to save industry content: ${error.message}`);
  return mapIndustryContent(data);
}
