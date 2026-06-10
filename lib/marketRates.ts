// Synthetic local-market pay benchmarks for light-industrial roles.
//
// IMPORTANT (and stated plainly in the UI + README): these numbers are
// illustrative, not real Traba data. They exist so the pay-competitiveness
// analysis is tangible. With real shift-history data, this table would be
// replaced by learned, per-market rates. Ranges are kept inside Traba's
// published $13–$38/hr posting band.

export interface MarketRate {
  median: number;
  low: number;
  high: number;
  /** Keywords that map a free-text role to this benchmark. */
  match: string[];
}

// Ordered most-specific first so matching prefers specific roles.
export const MARKET_RATES: Record<string, MarketRate> = {
  "Forklift Operator": {
    median: 22,
    low: 19,
    high: 27,
    match: ["forklift", "reach truck", "cherry picker", "lift operator"],
  },
  "Machine Operator": {
    median: 21,
    low: 18,
    high: 26,
    match: ["machine operator", "production operator", "line operator", "cnc"],
  },
  "Food Production Worker": {
    median: 19,
    low: 16,
    high: 23,
    match: ["food", "gmp", "production", "packaging line", "cold storage", "dairy"],
  },
  "Picker / Packer": {
    median: 18,
    low: 15,
    high: 22,
    match: ["picker", "packer", "pick", "pack", "fulfillment", "order selector"],
  },
  "Loader / Unloader": {
    median: 19,
    low: 16,
    high: 24,
    match: ["loader", "unloader", "load", "unload", "freight", "lumper", "dock"],
  },
  "Quality Control Associate": {
    median: 20,
    low: 17,
    high: 25,
    match: ["quality", "qc", "inspection", "inspector"],
  },
  "Warehouse Associate": {
    median: 18,
    low: 15,
    high: 22,
    match: ["warehouse", "general labor", "associate", "material handler", "distribution"],
  },
};

const DEFAULT_RATE: MarketRate = {
  median: 18,
  low: 15,
  high: 22,
  match: [],
};

/** Find the closest market benchmark for a role title (case-insensitive). */
export function lookupMarketRate(roleTitle: string): { name: string; rate: MarketRate } {
  const needle = roleTitle.toLowerCase();

  // 1. Exact-ish title match.
  for (const [name, rate] of Object.entries(MARKET_RATES)) {
    if (needle.includes(name.toLowerCase())) return { name, rate };
  }
  // 2. Keyword match.
  for (const [name, rate] of Object.entries(MARKET_RATES)) {
    if (rate.match.some((kw) => needle.includes(kw))) return { name, rate };
  }
  // 3. Fallback to the general warehouse benchmark.
  return { name: "Warehouse Associate", rate: DEFAULT_RATE };
}
