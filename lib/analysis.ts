// Deterministic reliability analysis.
//
// Given a structured ParsedShift, this module produces the pay benchmark,
// the field-by-field flags, and the fill-rate readiness score. It is shared
// by BOTH generation paths (Claude and the demo engine) so the analytical
// layer is transparent, explainable, and identical no matter how the text
// was parsed. The language model never invents the score — it only parses
// the request into fields; the scoring is rules-based and auditable here.
//
// The scoring model is grounded in the factors Traba and the staffing
// literature cite as the real drivers of shift fill rate and no-shows:
// pay competitiveness, lead time, posting completeness, site logistics
// clarity, requirement specificity, and shift desirability.

import type {
  FieldFlag,
  FillImpact,
  FillReadiness,
  ParsedShift,
  PayBenchmark,
  ScoreFactor,
} from "./types";
import { lookupMarketRate } from "./marketRates";

export function computeBenchmark(parsed: ParsedShift): PayBenchmark {
  const { name, rate } = lookupMarketRate(parsed.roleTitle);
  const deltaPct =
    parsed.payRate != null
      ? Math.round(((parsed.payRate - rate.median) / rate.median) * 100)
      : null;
  return {
    roleTitle: name,
    marketMedian: rate.median,
    marketLow: rate.low,
    marketHigh: rate.high,
    deltaPct,
  };
}

/** Heuristic: does the timing text describe an early-morning or overnight shift? */
function isUnsocialShift(parsed: ParsedShift): boolean {
  const t = (parsed.shiftTiming ?? "").toLowerCase();
  return /overnight|3rd shift|third shift|graveyard|\b(1|2|3|4|5)\s*(am|a\.m)/.test(t) ||
    /midnight|11\s*pm|10\s*pm/.test(t);
}

export function computeFlags(parsed: ParsedShift, benchmark: PayBenchmark): FieldFlag[] {
  const flags: FieldFlag[] = [];

  // Pay rate — the single biggest driver of whether workers claim a shift.
  if (parsed.payRate == null) {
    flags.push({
      field: "payRate",
      label: "Pay rate",
      status: "missing",
      impact: "high",
      message:
        "No pay rate. Workers sort and filter by pay first — a post without it gets skipped. Add an hourly rate.",
    });
  } else if (benchmark.deltaPct != null && benchmark.deltaPct <= -8) {
    flags.push({
      field: "payRate",
      label: "Pay rate",
      status: "weak",
      impact: "high",
      message: `$${parsed.payRate}/hr is ${Math.abs(benchmark.deltaPct)}% below the ~$${benchmark.marketMedian}/hr local median for ${benchmark.roleTitle}. Below-market pay is the top cause of slow fill and last-minute drop-off.`,
    });
  } else {
    const vs =
      benchmark.deltaPct == null
        ? ""
        : benchmark.deltaPct >= 0
          ? ` (${benchmark.deltaPct}% above the ~$${benchmark.marketMedian}/hr median)`
          : ` (${Math.abs(benchmark.deltaPct)}% below median, but within range)`;
    flags.push({
      field: "payRate",
      label: "Pay rate",
      status: "ok",
      impact: "high",
      message: `$${parsed.payRate}/hr is competitive for ${benchmark.roleTitle}${vs}.`,
    });
  }

  // Headcount.
  if (parsed.headcount == null) {
    flags.push({
      field: "headcount",
      label: "Headcount",
      status: "missing",
      impact: "medium",
      message: "Number of workers isn't specified — needed to size the booking and a no-show buffer.",
    });
  } else {
    flags.push({
      field: "headcount",
      label: "Headcount",
      status: "ok",
      impact: "medium",
      message: `${parsed.headcount} worker${parsed.headcount === 1 ? "" : "s"} requested.`,
    });
  }

  // Shift timing + desirability.
  if (parsed.shiftTiming == null) {
    flags.push({
      field: "shiftTiming",
      label: "Shift time",
      status: "missing",
      impact: "high",
      message: "No date/time. Workers can't plan around an unspecified shift, so it won't get claimed.",
    });
  } else if (isUnsocialShift(parsed)) {
    flags.push({
      field: "shiftTiming",
      label: "Shift time",
      status: "weak",
      impact: "medium",
      message:
        "Overnight / early-morning shifts historically see higher no-show rates. Consider a pay premium or a larger buffer to protect fill.",
    });
  } else {
    flags.push({
      field: "shiftTiming",
      label: "Shift time",
      status: "ok",
      impact: "medium",
      message: `Scheduled: ${parsed.shiftTiming}.`,
    });
  }

  // Location + logistics.
  if (parsed.location == null) {
    flags.push({
      field: "location",
      label: "Location",
      status: "missing",
      impact: "high",
      message: "No worksite location. Distance to site is a primary driver of who shows up — this is required.",
    });
  } else if (!parsed.hasLogisticsDetail) {
    flags.push({
      field: "location",
      label: "Location & logistics",
      status: "weak",
      impact: "medium",
      message: `"${parsed.location}" is set, but there are no parking, entrance, or report-to details. Confusion on arrival causes late starts and turnarounds. Add gate/parking info.`,
    });
  } else {
    flags.push({
      field: "location",
      label: "Location & logistics",
      status: "ok",
      impact: "medium",
      message: `Location and arrival details provided for ${parsed.location}.`,
    });
  }

  // Certifications / required skills.
  if (parsed.certifications.length > 0) {
    flags.push({
      field: "certifications",
      label: "Certifications",
      status: "ok",
      impact: "low",
      message: `Requires: ${parsed.certifications.join(", ")}. Clear requirements let the platform match verified workers and reduce on-site mismatch.`,
    });
  } else {
    flags.push({
      field: "certifications",
      label: "Certifications",
      status: "ok",
      impact: "low",
      message: "No special certifications — widest possible worker pool.",
    });
  }

  // Attire / safety.
  if (parsed.attire == null) {
    flags.push({
      field: "attire",
      label: "Required attire",
      status: "weak",
      impact: "low",
      message:
        "No attire/PPE specified. Workers showing up without steel-toes or hi-vis can be turned away — define it up front.",
    });
  } else {
    flags.push({
      field: "attire",
      label: "Required attire",
      status: "ok",
      impact: "low",
      message: `Attire specified: ${parsed.attire}.`,
    });
  }

  // Lead time.
  if (parsed.leadTimeHours == null) {
    flags.push({
      field: "leadTime",
      label: "Lead time",
      status: "weak",
      impact: "medium",
      message: "Lead time is unclear. More advance notice gives workers time to claim and plan, which lifts fill.",
    });
  } else if (parsed.leadTimeHours < 12) {
    flags.push({
      field: "leadTime",
      label: "Lead time",
      status: "weak",
      impact: "medium",
      message: `Only ~${parsed.leadTimeHours}h of lead time. Same-day fills are possible but riskier — book a larger buffer.`,
    });
  } else {
    flags.push({
      field: "leadTime",
      label: "Lead time",
      status: "ok",
      impact: "medium",
      message: `~${parsed.leadTimeHours}h of advance notice gives workers room to claim and plan.`,
    });
  }

  return flags;
}

export function computeReadiness(
  parsed: ParsedShift,
  benchmark: PayBenchmark,
): FillReadiness {
  const factors: ScoreFactor[] = [];

  // 1. Pay competitiveness — 30 pts.
  {
    const max = 30;
    let earned: number;
    let detail: string;
    if (parsed.payRate == null) {
      earned = 0;
      detail = "No pay rate posted — workers can't evaluate the shift.";
    } else {
      const delta = benchmark.deltaPct ?? 0;
      // +10% over median = full marks; at median ≈ 80%; -20% ≈ 0.
      const ratio = Math.max(0, Math.min(1, (delta + 20) / 30));
      earned = Math.round(ratio * max);
      detail =
        delta >= 0
          ? `$${parsed.payRate}/hr is ${delta}% above the ~$${benchmark.marketMedian}/hr median.`
          : `$${parsed.payRate}/hr is ${Math.abs(delta)}% below the ~$${benchmark.marketMedian}/hr median.`;
    }
    factors.push({ label: "Pay competitiveness", earned, max, detail });
  }

  // 2. Lead time — 20 pts.
  {
    const max = 20;
    let earned: number;
    let detail: string;
    if (parsed.leadTimeHours == null) {
      earned = 10;
      detail = "Lead time not specified — assumed moderate.";
    } else if (parsed.leadTimeHours >= 48) {
      earned = 20;
      detail = `${parsed.leadTimeHours}h of notice — plenty of time for workers to claim.`;
    } else if (parsed.leadTimeHours >= 24) {
      earned = 16;
      detail = `${parsed.leadTimeHours}h of notice — solid lead time.`;
    } else if (parsed.leadTimeHours >= 12) {
      earned = 11;
      detail = `${parsed.leadTimeHours}h of notice — workable but tighter.`;
    } else {
      earned = 6;
      detail = `Only ${parsed.leadTimeHours}h of notice — same-day risk.`;
    }
    factors.push({ label: "Lead time", earned, max, detail });
  }

  // 3. Posting completeness — 25 pts (5 required fields x 5).
  {
    const max = 25;
    const present = [
      parsed.payRate != null,
      parsed.headcount != null,
      parsed.shiftTiming != null,
      parsed.location != null,
      parsed.attire != null,
    ];
    const count = present.filter(Boolean).length;
    const earned = Math.round((count / present.length) * max);
    factors.push({
      label: "Posting completeness",
      earned,
      max,
      detail: `${count} of 5 core fields present (pay, headcount, time, location, attire).`,
    });
  }

  // 4. Site logistics clarity — 10 pts.
  {
    const max = 10;
    const earned = parsed.location != null && parsed.hasLogisticsDetail ? 10 : parsed.location != null ? 4 : 0;
    factors.push({
      label: "Site logistics clarity",
      earned,
      max,
      detail:
        earned === 10
          ? "Parking / entrance / report-to details included."
          : earned === 4
            ? "Location set, but no arrival details."
            : "No worksite details.",
    });
  }

  // 5. Shift desirability — 15 pts.
  {
    const max = 15;
    let earned = 15;
    let detail = "Standard daytime shift — broadly attractive.";
    if (parsed.shiftTiming == null) {
      earned = 7;
      detail = "Shift time unspecified.";
    } else if (isUnsocialShift(parsed)) {
      // Unsocial hours hurt, but strong pay offsets it.
      const payOffset = (benchmark.deltaPct ?? 0) >= 10;
      earned = payOffset ? 11 : 8;
      detail = payOffset
        ? "Overnight/early shift, but a pay premium offsets the no-show risk."
        : "Overnight/early shift — higher historical no-show risk.";
    }
    factors.push({ label: "Shift desirability", earned, max, detail });
  }

  const score = factors.reduce((s, f) => s + f.earned, 0);
  const band: FillReadiness["band"] = score >= 75 ? "strong" : score >= 55 ? "moderate" : "at-risk";

  // Map the 0–100 readiness score onto an illustrative fill-rate range.
  // Anchored to the industry contrast: a weak post behaves like a traditional
  // agency (~55%), a strong one approaches the platform's ~98% ceiling.
  const projectedFillRate = Math.round(55 + (score / 100) * 43);

  // Buffer = expected no-shows on the requested headcount, rounded up.
  const headcount = parsed.headcount ?? 0;
  const noShowRate = (100 - projectedFillRate) / 100;
  const suggestedBuffer = headcount > 0 ? Math.max(0, Math.ceil(headcount * noShowRate)) : 0;

  return { score, band, factors, projectedFillRate, suggestedBuffer };
}

/** Convenience: run the full deterministic analysis for a parsed shift. */
export function analyze(parsed: ParsedShift) {
  const benchmark = computeBenchmark(parsed);
  const flags = computeFlags(parsed, benchmark);
  const readiness = computeReadiness(parsed, benchmark);
  return { benchmark, flags, readiness };
}
