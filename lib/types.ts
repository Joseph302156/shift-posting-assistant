// Core data model for the AI Shift-Posting Assistant.
//
// A manager types a plain-English staffing request; the assistant returns a
// structured, Traba-style shift post plus a transparent fill-rate readiness
// analysis. These types are the contract shared between the generation layer
// (lib/anthropic.ts, lib/demoEngine.ts) and the UI.

/** A required certification or verified skill (forklift, GMP, etc.). */
export type Certification = string;

/** The structured shift fields parsed out of the manager's request. */
export interface ParsedShift {
  /** Short role title, e.g. "Forklift Operator" or "Warehouse Associate". */
  roleTitle: string;
  /** Number of workers needed. null if the request didn't say. */
  headcount: number | null;
  /** Hourly wage the business will pay the worker, in USD. null if unstated. */
  payRate: number | null;
  /** Free-text shift timing as written, e.g. "Tuesday overnight" or "5am–1pm Mon". */
  shiftTiming: string | null;
  /** Estimated shift length in hours, if it can be inferred. */
  shiftLengthHours: number | null;
  /** Hours of advance notice before the shift starts (lead time). null if unknown. */
  leadTimeHours: number | null;
  /** Free-text location as written, e.g. "Dallas DC" or "near the Newark port". */
  location: string | null;
  /** Whether the request included parking / entrance / report-to details. */
  hasLogisticsDetail: boolean;
  /** Required certifications / verified skills. */
  certifications: Certification[];
  /** Required attire (steel-toe boots, hi-vis vest, etc.). null if unstated. */
  attire: string | null;
}

/** Which Traba-required field a flag is about. */
export type ShiftField =
  | "payRate"
  | "headcount"
  | "shiftTiming"
  | "location"
  | "certifications"
  | "attire"
  | "leadTime";

export type FlagStatus = "ok" | "weak" | "missing";
export type FillImpact = "high" | "medium" | "low";

/**
 * A single field-level finding: what's present, missing, or weak, and *why it
 * matters for fill rate*. This is the heart of the product — it teaches the
 * manager how each choice moves reliability.
 */
export interface FieldFlag {
  field: ShiftField;
  label: string;
  status: FlagStatus;
  /** Manager-facing explanation tied to fill rate / worker behavior. */
  message: string;
  /** How much this field moves the fill rate. */
  impact: FillImpact;
}

/** One contributing factor in the transparent fill-rate readiness score. */
export interface ScoreFactor {
  label: string;
  /** Points earned out of `max` for this factor. */
  earned: number;
  max: number;
  /** Short explanation of the score for this factor. */
  detail: string;
}

export interface FillReadiness {
  /** 0–100 readiness score. */
  score: number;
  /** Human label: "Strong", "Moderate", "At risk". */
  band: "strong" | "moderate" | "at-risk";
  factors: ScoreFactor[];
  /** Projected fill rate as a percent (illustrative, model-disclosed). */
  projectedFillRate: number;
  /** Suggested over-book buffer (extra workers to book to absorb no-shows). */
  suggestedBuffer: number;
}

/** Pay benchmark context for the parsed role. */
export interface PayBenchmark {
  roleTitle: string;
  /** Synthetic local market median hourly rate in USD. */
  marketMedian: number;
  marketLow: number;
  marketHigh: number;
  /** Posted rate vs. market median, as a percent (+/-). null if no pay given. */
  deltaPct: number | null;
}

/** The full result the assistant returns for one request. */
export interface ShiftPostResult {
  parsed: ParsedShift;
  /** Worker-facing rewrite of the role description, optimized to attract talent. */
  workerDescription: string;
  /** One-line internal summary of the structured post. */
  summary: string;
  flags: FieldFlag[];
  benchmark: PayBenchmark;
  readiness: FillReadiness;
  /** Where the result came from, surfaced honestly in the UI. */
  engine: "claude" | "demo";
  /** Model id used, when engine === "claude". */
  model?: string;
}

export interface GenerateRequestBody {
  request: string;
}
