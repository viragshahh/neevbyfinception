export interface Sector {
  slug: string;
  name: string;
}

export const SECTORS: Sector[] = [
  { slug: "banking-financial-services", name: "Banking & Financial Services" },
  { slug: "it", name: "IT" },
  { slug: "healthcare", name: "Healthcare" },
  { slug: "fmcg", name: "FMCG" },
  { slug: "renewable-energy", name: "Renewable Energy" },
];

export function getSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

export interface Layer {
  key: string;
  label: string;
  month: string;
  question: string;
}

export const LAYERS: Layer[] = [
  { key: "overview", label: "Overview", month: "Aug", question: "Should we invest in this industry?" },
  {
    key: "valueChain",
    label: "Value Chain",
    month: "Sep",
    question: "Where in the value chain should we invest?",
  },
  {
    key: "businessModel",
    label: "Business Model",
    month: "Oct",
    question: "Which business model deserves our capital?",
  },
  {
    key: "financialDashboard",
    label: "Financial Dashboard",
    month: "Nov",
    question: "Which companies generate superior returns?",
  },
  {
    key: "valuationDashboard",
    label: "Valuation Dashboard",
    month: "Dec",
    question: "Which companies are undervalued today?",
  },
  {
    key: "governanceEsg",
    label: "Governance & ESG",
    month: "Jan",
    question: "Can management be trusted with capital?",
  },
  {
    key: "growthRisk",
    label: "Growth & Risk",
    month: "Feb",
    question: "What will drive returns over 3-5 years?",
  },
  {
    key: "annualReview",
    label: "Annual Review",
    month: "Mar",
    question: "Did our process outperform the market?",
  },
];

export function getLayer(key: string): Layer | undefined {
  return LAYERS.find((l) => l.key === key);
}

// Reports are only ever tagged to one of the 5 mandated sectors — keeps the
// /reports filter buttons meaningful for every report uploaded going forward.
export const REPORT_SECTOR_OPTIONS = SECTORS.map((s) => s.name);

export const FUND_CONFIG = {
  notionalAum: 1_000_000,
  benchmarkName: "Nifty 500",
  benchmarkSymbol: "^CRSLDX",
  cycleLabel: "Aug 2026 - Mar 2027",
  cycleStartDate: "2026-08-01",
  maxSingleStockWeight: 0.1,
  maxSingleSectorWeight: 0.3,
  minCashBuffer: 0.05,
  minNamesAtFullDeployment: 15,
  maxNamesAtFullDeployment: 20,
};
