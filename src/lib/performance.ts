export interface PerformanceStats {
  totalReturnPct: number | null;
  annualizedReturnPct: number | null;
  annualizedVolatilityPct: number | null;
  maxDrawdownPct: number | null;
  observations: number;
}

export function computePerformanceStats(values: { date: string; value: number }[]): PerformanceStats {
  const clean = values.filter((x) => Number.isFinite(x.value) && x.value > 0).sort((a, b) => a.date.localeCompare(b.date));
  if (clean.length < 2) {
    return {
      totalReturnPct: null,
      annualizedReturnPct: null,
      annualizedVolatilityPct: null,
      maxDrawdownPct: null,
      observations: clean.length,
    };
  }

  const first = clean[0];
  const last = clean[clean.length - 1];
  const totalReturnPct = (last.value / first.value - 1) * 100;
  const days = Math.max(
    1,
    Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000)
  );
  const years = days / 365.25;
  const annualizedReturnPct = years >= 0.25 ? (Math.pow(last.value / first.value, 1 / years) - 1) * 100 : null;

  const dailyReturns: number[] = [];
  for (let i = 1; i < clean.length; i++) {
    dailyReturns.push(clean[i].value / clean[i - 1].value - 1);
  }

  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.length > 1
      ? dailyReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (dailyReturns.length - 1)
      : 0;
  const annualizedVolatilityPct = Math.sqrt(variance) * Math.sqrt(252) * 100;

  let peak = clean[0].value;
  let maxDrawdown = 0;
  for (const point of clean) {
    peak = Math.max(peak, point.value);
    maxDrawdown = Math.min(maxDrawdown, point.value / peak - 1);
  }

  return {
    totalReturnPct,
    annualizedReturnPct,
    annualizedVolatilityPct,
    maxDrawdownPct: maxDrawdown * 100,
    observations: clean.length,
  };
}

export function indexTo100(values: { date: string; value: number }[]) {
  const clean = values.filter((x) => Number.isFinite(x.value) && x.value > 0);
  if (!clean.length) return [];
  const base = clean[0].value;
  return clean.map((x) => ({ date: x.date, value: (x.value / base) * 100 }));
}
