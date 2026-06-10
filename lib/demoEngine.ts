// Deterministic, dependency-free fallback parser.
//
// Runs when no ANTHROPIC_API_KEY is configured, so the app is fully functional
// out-of-the-box for anyone who opens it. It is intentionally simple keyword/
// regex extraction — good enough to demo the product end-to-end. With a key
// set, the Claude path (lib/anthropic.ts) replaces this with far better
// language understanding, but feeds the exact same downstream analysis.

import type { LlmParseOutput } from "./prompt";

const ROLE_RULES: { title: string; kw: RegExp }[] = [
  { title: "Forklift Operator", kw: /forklift|reach truck|cherry picker|lift operator/i },
  { title: "Security Officer", kw: /security\s+(?:officer|guard)|\bsecurity\b|\bguards?\b/i },
  { title: "Quality Control Associate", kw: /\bqc\b|quality control|inspection|inspector/i },
  { title: "Food Production Worker", kw: /\bgmp\b|food|dairy|production line|cold storage|bottling/i },
  { title: "Machine Operator", kw: /machine operator|cnc|line operator|press operator/i },
  { title: "Loader / Unloader", kw: /loader|unloader|load(ing)?|unload(ing)?|freight|lumper|dock/i },
  { title: "Picker / Packer", kw: /picker|packer|\bpick\b|\bpack\b|fulfillment|order select/i },
  { title: "Janitor / Cleaner", kw: /janitor|custodian|cleaner|cleaning crew/i },
  { title: "Warehouse Associate", kw: /warehouse|material handler|general labor|associate|distribution/i },
];

function detectRole(text: string): string {
  for (const r of ROLE_RULES) if (r.kw.test(text)) return r.title;
  return "Warehouse Associate";
}

// Any noun a manager might use for "the workers", so headcount like "6 guards"
// or "a couple of loaders" is understood. `forklifts?` lets "10 forklift
// drivers" match (the next word is allowed to be anything).
const WORKER_NOUN =
  "(?:workers?|people|persons?|associates?|pickers?|packers?|loaders?|unloaders?|operators?|drivers?|officers?|guards?|cleaners?|janitors?|laborers?|labourers?|temps?|hands?|bodies|folks|staff|crew|helpers?|movers?|sorters?|handlers?|forklifts?)";

// Spelled-out counts. Articles map to 1; vague quantifiers to a small number.
const NUM_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, couple: 2, few: 3, several: 4, handful: 4,
};

function detectPay(text: string): number | null {
  // "$18", "$18/hr", "18 dollars an hour", "at 18.50 per hour"
  const m =
    text.match(/\$\s?(\d{1,2}(?:\.\d{1,2})?)/) ??
    text.match(/(\d{1,2}(?:\.\d{1,2})?)\s*(?:dollars?)?\s*(?:\/|\bper\b|\ban?\b)\s*(?:hr|hour)/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return v >= 10 && v <= 60 ? v : null;
}

function clampCount(v: number): number | null {
  return Number.isFinite(v) && v > 0 && v <= 500 ? v : null;
}

function detectHeadcount(text: string): number | null {
  // 1) Digits directly before a worker noun: "4 workers", "10 forklift drivers".
  let m = text.match(new RegExp(`\\b(\\d{1,3})\\s+(?:[\\w-]+\\s+){0,2}${WORKER_NOUN}\\b`, "i"));
  if (m) return clampCount(parseInt(m[1], 10));

  // 2) Action verb + digits: "need 4", "looking for 12", "book 6".
  m = text.match(/\b(?:need|want|looking for|hire|book|staff|require|send|bring(?: in)?|get)\s+(?:me\s+|us\s+)?(\d{1,3})\b/i);
  if (m) return clampCount(parseInt(m[1], 10));

  // 3) Spelled-out count (optionally with an article) before a worker noun:
  //    "four workers", "a couple of loaders", "a dozen pickers", "two guards".
  const words = Object.keys(NUM_WORDS).join("|");
  m = text.match(new RegExp(`\\b(?:a |an )?(${words})\\s+(?:of\\s+)?(?:[\\w-]+\\s+){0,2}${WORKER_NOUN}\\b`, "i"));
  if (m && m[1]) return clampCount(NUM_WORDS[m[1].toLowerCase()]);

  return null;
}

function detectCerts(text: string): string[] {
  const certs: string[] = [];
  if (/forklift/i.test(text)) certs.push("Forklift certification");
  if (/reach truck/i.test(text)) certs.push("Reach-truck experience");
  if (/\bgmp\b/i.test(text)) certs.push("GMP");
  if (/osha/i.test(text)) certs.push("OSHA training");
  if (/\bhazmat\b/i.test(text)) certs.push("HAZMAT");
  return certs;
}

function tidy(phrase: string): string {
  return phrase
    .trim()
    .replace(/[.,;]+$/, "")
    .replace(/^(?:a|an|the|in|your|your own|some)\s+/i, "")
    .replace(/^./, (c) => c.toUpperCase());
}

function detectAttire(text: string): string | null {
  const parts: string[] = [];
  // Common light-industrial PPE, normalized to clean phrasing.
  if (/steel[-\s]?toe|safety boots?/i.test(text)) parts.push("steel-toe boots");
  if (/hi[-\s]?vis|high[-\s]?vis|safety vest|reflective/i.test(text)) parts.push("hi-vis vest");
  if (/hard hat|helmet/i.test(text)) parts.push("hard hat");
  if (/\bgloves\b/i.test(text)) parts.push("work gloves");
  if (/hair ?net|beard net/i.test(text)) parts.push("hairnet");

  // Uniforms: capture the words leading up to "uniform" (e.g. "security officer uniform").
  const uniform = text.match(/((?:[a-z][\w-]*\s+){0,3}uniforms?)\b/i);
  if (uniform) parts.push(tidy(uniform[1]));

  if (parts.length === 0) {
    // Generic dress instruction: "wear all black", "come in business casual",
    // "bring your own boots", "dress code: …".
    const generic = text.match(
      /\b(?:wear(?:ing)?|come (?:in|wearing)|dressed in|dress code[:\s]+|must have on)\s+([a-z][\w\s,/&-]{2,45})/i,
    );
    if (generic) parts.push(tidy(generic[1]));
  }

  if (parts.length === 0) return null;
  // De-dupe and present as a single readable phrase.
  const unique = [...new Set(parts)];
  return unique.join(", ").replace(/^./, (c) => c.toUpperCase());
}

function detectLocation(text: string): string | null {
  const m =
    text.match(/\b(?:near|at|in|by)\s+(?:the\s+)?([A-Z][\w.&'-]*(?:\s+[A-Z][\w.&'-]*){0,3}(?:\s+(?:DC|warehouse|center|centre|facility|plant|port|terminal))?)/) ??
    text.match(/([A-Z][\w.&'-]*(?:\s+[A-Z][\w.&'-]*){0,2})\s+(?:DC|distribution center|warehouse|facility|plant)/);
  if (!m) return null;
  const loc = m[1].trim();
  return loc.length > 1 ? loc : null;
}

function detectLogistics(text: string): boolean {
  return /parking|entrance|gate|dock door|report to|check ?in at|loading dock|door \d/i.test(text);
}

function detectTiming(text: string): string | null {
  const tokens: string[] = [];
  const day = text.match(/\b(mon|tue|wed|thu|fri|sat|sun)(?:day|s|nesday|rsday|urday)?\b/i);
  const rel = text.match(/\b(today|tonight|tomorrow|this weekend|next week|asap)\b/i);
  const range = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  const part = text.match(/\b(overnight|graveyard|morning|afternoon|evening|day shift|night shift|1st shift|2nd shift|3rd shift)\b/i);
  if (day) tokens.push(day[0]);
  else if (rel) tokens.push(rel[0]);
  if (part) tokens.push(part[0]);
  if (range) tokens.push(`${range[1]}–${range[2]}`);
  if (tokens.length === 0) return null;
  return tokens.join(", ");
}

function detectShiftLength(text: string, timing: string | null): number | null {
  const m = text.match(/\b(\d{1,2})\s*-?\s*hour/i);
  if (m) return parseInt(m[1], 10);
  if (timing && /overnight|graveyard/i.test(timing)) return 8;
  return null;
}

function detectLeadTime(text: string): number | null {
  if (/\b(today|tonight|asap|same[-\s]?day|right now)\b/i.test(text)) return 6;
  if (/\btomorrow\b/i.test(text)) return 24;
  if (/\bthis weekend\b/i.test(text)) return 48;
  if (/\bnext week\b/i.test(text)) return 120;
  return null;
}

function buildDescription(role: string, pay: number | null, timing: string | null, certs: string[]): string {
  const lead = pay != null ? `Earn $${pay}/hr` : "Hourly pay";
  const when = timing ? ` Shift: ${timing}.` : "";
  const skill = certs.length > 0 ? ` ${certs.join(" and ")} required.` : "";
  const body: Record<string, string> = {
    "Forklift Operator": "operating a forklift to move and stage palletized freight in the warehouse.",
    "Picker / Packer": "picking and packing orders to keep fulfillment moving.",
    "Loader / Unloader": "loading and unloading trucks and staging freight on the dock.",
    "Food Production Worker": "working a production line in a food-grade facility.",
    "Machine Operator": "running and tending production equipment on the line.",
    "Quality Control Associate": "inspecting product and flagging issues to keep quality on spec.",
    "Security Officer": "providing on-site security coverage and monitoring access to the facility.",
    "Janitor / Cleaner": "handling cleaning and upkeep to keep the site safe and presentable.",
    "Warehouse Associate": "general warehouse work — moving, sorting, and staging product.",
  };
  const duties = body[role] ?? "carrying out the duties for this shift.";
  return `${lead} as a ${role}. You'll be ${duties}${skill}${when} Reliable, straightforward work with clear expectations.`.trim();
}

export function demoParse(request: string): LlmParseOutput {
  const text = request.trim();
  const roleTitle = detectRole(text);
  const payRate = detectPay(text);
  const headcount = detectHeadcount(text);
  const certifications = detectCerts(text);
  const attire = detectAttire(text);
  const location = detectLocation(text);
  const shiftTiming = detectTiming(text);
  const shiftLengthHours = detectShiftLength(text, shiftTiming);
  const leadTimeHours = detectLeadTime(text);
  const hasLogisticsDetail = detectLogistics(text);

  const workerDescription = buildDescription(roleTitle, payRate, shiftTiming, certifications);
  const summary = `${headcount ?? "?"}× ${roleTitle}${payRate != null ? ` @ $${payRate}/hr` : ""}${
    shiftTiming ? ` · ${shiftTiming}` : ""
  }${location ? ` · ${location}` : ""}`;

  return {
    roleTitle,
    headcount,
    payRate,
    shiftTiming,
    shiftLengthHours,
    leadTimeHours,
    location,
    hasLogisticsDetail,
    certifications,
    attire,
    workerDescription,
    summary,
  };
}
