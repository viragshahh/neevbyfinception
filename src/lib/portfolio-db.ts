import { randomUUID } from "crypto";
import { supabase } from "./supabase";

export interface NavEntry {
  id: string; date: string; nav: number; note: string | null;
  unitNav?: number | null; totalAssets?: number | null; cash?: number | null;
  liabilities?: number | null; valuationStatus?: string; priceCoveragePct?: number | null;
}
export interface Holding {
  id: string; symbol: string; companyName: string; sector: string; quantity: number;
  avgCost: number; entryDate: string; status: "active" | "exited";
  exitDate: string | null; exitPrice: number | null;
}
export interface Decision {
  id: string; date: string; sector: string; companyName: string | null; symbol: string | null;
  decision: "BUY" | "HOLD" | "SELL"; rationale: string; voteCount: string | null;
  caseId?: string | null; status?: string; meetingReference?: string | null;
  quorum?: number | null; votesFor?: number | null; votesAgainst?: number | null;
  abstentions?: number | null; proposedWeight?: number | null; riskNotes?: string | null;
  thesisBreakers?: string | null; approvedAt?: string | null;
}
export interface Transaction {
  id: string; symbol: string; companyName: string; sector: string;
  transactionType: "BUY" | "SELL"; tradeDate: string; settlementDate: string | null;
  quantity: number; price: number; grossAmount: number; fees: number; taxes: number;
  decisionId: string | null; status: string; reference: string | null; notes: string | null;
}
export interface InvestmentCase {
  id: string; symbol: string; companyName: string; sectorCode: string; status: string;
  thesis: string; keyRisks: string | null; thesisBreakers: string | null;
  valuationMethod: string | null; bearCase: string | null; baseCase: string | null; bullCase: string | null;
  bearValue: number | null; baseValue: number | null; bullValue: number | null; proposedWeight: number | null;
  sourceReportId: string | null;
}
export interface IndustryContentEntry { sectorSlug: string; layer: string; title: string; content: string; updatedAt: string; }

export async function listNavHistory(): Promise<NavEntry[]> {
  const { data, error } = await supabase.from("nav_history").select("*").order("date", { ascending: true });
  if (error) throw new Error(`Failed to list NAV history: ${error.message}`);
  return (data ?? []).map((r) => ({
    id:r.id,date:r.date,nav:Number(r.nav),note:r.note,unitNav:r.unit_nav ? Number(r.unit_nav):null,
    totalAssets:r.total_assets ? Number(r.total_assets):null,cash:r.cash ? Number(r.cash):null,
    liabilities:r.liabilities ? Number(r.liabilities):null,valuationStatus:r.valuation_status,
    priceCoveragePct:r.price_coverage_pct ? Number(r.price_coverage_pct):null
  }));
}
export async function addNavEntry(input:{date:string;nav:number;note?:string;unitNav?:number;totalAssets?:number;cash?:number;liabilities?:number;valuationStatus?:string;priceCoveragePct?:number}):Promise<NavEntry>{
  const row={id:randomUUID(),date:input.date,nav:input.nav,note:input.note??null,unit_nav:input.unitNav??null,total_assets:input.totalAssets??null,cash:input.cash??null,liabilities:input.liabilities??null,valuation_status:input.valuationStatus??"UNVERIFIED",price_coverage_pct:input.priceCoveragePct??null};
  const {data,error}=await supabase.from("nav_history").upsert(row,{onConflict:"date"}).select().single();
  if(error) throw new Error(`Failed to save NAV entry: ${error.message}`); return listNavHistory().then(xs=>xs.find(x=>x.id===data.id)??{id:data.id,date:data.date,nav:Number(data.nav),note:data.note});
}
export async function listHoldings():Promise<Holding[]>{
  const {data,error}=await supabase.from("holdings").select("*").order("entry_date",{ascending:false});
  if(error) throw new Error(`Failed to list holdings: ${error.message}`);
  return (data??[]).map(r=>({id:r.id,symbol:r.symbol,companyName:r.company_name,sector:r.sector,quantity:Number(r.quantity),avgCost:Number(r.avg_cost),entryDate:r.entry_date,status:r.status as "active"|"exited",exitDate:r.exit_date,exitPrice:r.exit_price==null?null:Number(r.exit_price)}));
}
export async function addHolding(input:Omit<Holding,"id"|"status"|"exitDate"|"exitPrice">):Promise<Holding>{
  const row={id:randomUUID(),symbol:input.symbol,company_name:input.companyName,sector:input.sector,quantity:input.quantity,avg_cost:input.avgCost,entry_date:input.entryDate,status:"active"};
  const {data,error}=await supabase.from("holdings").insert(row).select().single();
  if(error) throw new Error(`Failed to add holding: ${error.message}`);
  await ensureSecurity(input.symbol,input.companyName,input.sector);
  await postTransaction({symbol:input.symbol,companyName:input.companyName,sector:input.sector,transactionType:"BUY",tradeDate:input.entryDate,quantity:input.quantity,price:input.avgCost,grossAmount:input.quantity*input.avgCost,notes:"Opening position recorded through portfolio admin."});
  return {id:data.id,symbol:data.symbol,companyName:data.company_name,sector:data.sector,quantity:Number(data.quantity),avgCost:Number(data.avg_cost),entryDate:data.entry_date,status:"active",exitDate:null,exitPrice:null};
}
export async function exitHolding(id:string,exitDate:string,exitPrice:number):Promise<boolean>{
  const {data:current,error:getError}=await supabase.from("holdings").select("*").eq("id",id).maybeSingle();
  if(getError) throw new Error(`Failed to read holding: ${getError.message}`);
  if(!data) return false;
  const {data:updated,error}=await supabase.from("holdings").update({status:"exited",exit_date:exitDate,exit_price:exitPrice}).eq("id",id).select().single();
  if(error) throw new Error(`Failed to exit holding: ${error.message}`);
  await postTransaction({symbol:data.symbol,companyName:data.company_name,sector:data.sector,transactionType:"SELL",tradeDate:exitDate,quantity:Number(data.quantity),price:exitPrice,grossAmount:Number(data.quantity)*exitPrice,notes:"Full exit recorded through portfolio admin."});
  return !!updated;
}
export async function deleteHolding(id:string):Promise<void>{
  throw new Error("Holdings are audit-controlled and cannot be deleted. Record a correcting transaction instead.");
}
export async function listTransactions():Promise<Transaction[]>{
  const {data,error}=await supabase.from("transactions").select("*").order("trade_date",{ascending:false}).order("created_at",{ascending:false});
  if(error) throw new Error(`Failed to list transactions: ${error.message}`);
  return (data??[]).map(r=>({id:r.id,symbol:r.symbol,companyName:r.company_name,sector:r.sector,transactionType:r.transaction_type,tradeDate:r.trade_date,settlementDate:r.settlement_date,quantity:Number(r.quantity),price:Number(r.price),grossAmount:Number(r.gross_amount),fees:Number(r.fees),taxes:Number(r.taxes),decisionId:r.decision_id,status:r.status,reference:r.reference,notes:r.notes}));
}
async function ensureSecurity(symbol:string,companyName:string,sector:string){
  const {error}=await supabase.from("securities").upsert({symbol,company_name:companyName,sector_code:sector},{onConflict:"symbol"});
  if(error) throw new Error(`Failed to maintain security master: ${error.message}`);
}
export async function postTransaction(input:{symbol:string;companyName:string;sector:string;transactionType:"BUY"|"SELL";tradeDate:string;settlementDate?:string;quantity:number;price:number;grossAmount:number;fees?:number;taxes?:number;decisionId?:string|null;reference?:string;notes?:string}):Promise<Transaction>{
  await ensureSecurity(input.symbol,input.companyName,input.sector);
  const row={id:randomUUID(),symbol:input.symbol,company_name:input.companyName,sector_code:input.sector,transaction_type:input.transactionType,trade_date:input.tradeDate,settlement_date:input.settlementDate??null,quantity:input.quantity,price:input.price,gross_amount:input.grossAmount,fees:input.fees??0,taxes:input.taxes??0,decision_id:input.decisionId??null,status:"POSTED",reference:input.reference??null,notes:input.notes??null};
  const {data,error}=await supabase.from("transactions").insert(row).select().single();
  if(error) throw new Error(`Failed to post transaction: ${error.message}`);
  const cashAmount=(input.transactionType==="SELL"?1:-1)*input.grossAmount-(input.fees??0)-(input.taxes??0);
  const {error:cashError}=await supabase.from("cash_ledger").insert({event_date:input.tradeDate,event_type:"TRADE",amount:cashAmount,reference_type:"transaction",reference_id:data.id,description:`${input.transactionType} ${input.symbol}`,status:"POSTED"});
  if(cashError) throw new Error(`Transaction posted but cash ledger failed: ${cashError.message}`);
  return {id:data.id,symbol:data.symbol,companyName:data.company_name,sector:data.sector_code,transactionType:data.transaction_type,tradeDate:data.trade_date,settlementDate:data.settlement_date,quantity:Number(data.quantity),price:Number(data.price),grossAmount:Number(data.gross_amount),fees:Number(data.fees),taxes:Number(data.taxes),decisionId:data.decision_id,status:data.status,reference:data.reference,notes:data.notes};
}
export async function listDecisions():Promise<Decision[]>{
  const {data,error}=await supabase.from("decisions").select("*").order("date",{ascending:false}).order("created_at",{ascending:false});
  if(error) throw new Error(`Failed to list decisions: ${error.message}`);
  return (data??[]).map(r=>({id:r.id,date:r.date,sector:r.sector,companyName:r.company_name,symbol:r.symbol,decision:r.decision,rationale:r.rationale,voteCount:r.vote_count,caseId:r.case_id,status:r.status,meetingReference:r.meeting_reference,quorum:r.quorum,votesFor:r.votes_for,votesAgainst:r.votes_against,abstentions:r.abstentions,proposedWeight:r.proposed_weight,riskNotes:r.risk_notes,thesisBreakers:r.thesis_breakers,approvedAt:r.approved_at}));
}
export async function addDecision(input:Omit<Decision,"id">):Promise<Decision>{
  const row={id:randomUUID(),date:input.date,sector:input.sector,company_name:input.companyName,symbol:input.symbol,decision:input.decision,rationale:input.rationale,vote_count:input.voteCount,case_id:input.caseId??null,status:input.status??"DRAFT",meeting_reference:input.meetingReference??null,quorum:input.quorum??null,votes_for:input.votesFor??null,votes_against:input.votesAgainst??null,abstentions:input.abstentions??null,proposed_weight:input.proposedWeight??null,risk_notes:input.riskNotes??null,thesis_breakers:input.thesisBreakers??null,approved_at:input.approvedAt??null};
  const {data,error}=await supabase.from("decisions").insert(row).select().single();
  if(error) throw new Error(`Failed to save decision: ${error.message}`);
  await supabase.from("audit_events").insert({action:"CREATE",entity_type:"decision",entity_id:data.id,after_data:data});
  return listDecisions().then(xs=>xs.find(x=>x.id===data.id)!);
}
export async function deleteDecision(id:string):Promise<void>{ throw new Error("Decision register entries are immutable. Amend or supersede a decision instead of deleting it."); }
export async function listInvestmentCases():Promise<InvestmentCase[]>{
  const {data,error}=await supabase.from("investment_cases").select("*").order("updated_at",{ascending:false});
  if(error) throw new Error(`Failed to list investment cases: ${error.message}`);
  return (data??[]).map(r=>({id:r.id,symbol:r.symbol,companyName:r.company_name,sectorCode:r.sector_code,status:r.status,thesis:r.thesis,keyRisks:r.key_risks,thesisBreakers:r.thesis_breakers,valuationMethod:r.valuation_method,bearCase:r.bear_case,baseCase:r.base_case,bullCase:r.bull_case,bearValue:r.bear_value==null?null:Number(r.bear_value),baseValue:r.base_value==null?null:Number(r.base_value),bullValue:r.bull_value==null?null:Number(r.bull_value),proposedWeight:r.proposed_weight==null?null:Number(r.proposed_weight),sourceReportId:r.source_report_id}));
}
export async function addInvestmentCase(input:Omit<InvestmentCase,"id">):Promise<InvestmentCase>{
  const row={id:randomUUID(),symbol:input.symbol,company_name:input.companyName,sector_code:input.sectorCode,status:input.status,thesis:input.thesis,key_risks:input.keyRisks,thesis_breakers:input.thesisBreakers,valuation_method:input.valuationMethod,bear_case:input.bearCase,base_case:input.baseCase,bull_case:input.bullCase,bear_value:input.bearValue,base_value:input.baseValue,bull_value:input.bullValue,proposed_weight:input.proposedWeight,source_report_id:input.sourceReportId};
  const {data,error}=await supabase.from("investment_cases").insert(row).select().single(); if(error) throw new Error(`Failed to create investment case: ${error.message}`);
  await supabase.from("audit_events").insert({action:"CREATE",entity_type:"investment_case",entity_id:data.id,after_data:data});
  return listInvestmentCases().then(xs=>xs.find(x=>x.id===data.id)!);
}
function mapIndustryContent(r:{sector_slug:string;layer:string;title:string;content:string;updated_at:string}):IndustryContentEntry{return {sectorSlug:r.sector_slug,layer:r.layer,title:r.title,content:r.content,updatedAt:r.updated_at};}
export async function listIndustryContent(sectorSlug:string){const {data,error}=await supabase.from("industry_content").select("*").eq("sector_slug",sectorSlug);if(error)throw new Error(`Failed to load industry content: ${error.message}`);return(data??[]).map(mapIndustryContent);}
export async function listAllIndustryContent(){const {data,error}=await supabase.from("industry_content").select("*");if(error)throw new Error(`Failed to load industry content: ${error.message}`);return(data??[]).map(mapIndustryContent);}
export async function upsertIndustryContent(input:{sectorSlug:string;layer:string;title:string;content:string}){const row={id:randomUUID(),sector_slug:input.sectorSlug,layer:input.layer,title:input.title,content:input.content,updated_at:new Date().toISOString()};const {data,error}=await supabase.from("industry_content").upsert(row,{onConflict:"sector_slug,layer"}).select().single();if(error)throw new Error(`Failed to save industry content: ${error.message}`);return mapIndustryContent(data);}
