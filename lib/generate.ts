// Orchestration: plain-English request -> structured, analyzed shift post.
//
// Path selection is honest and automatic:
//   • ANTHROPIC_API_KEY set  -> parse with Claude (claude-opus-4-8 by default)
//   • no key, or Claude errors -> deterministic demo parser
// Either way, the SAME deterministic reliability analysis (lib/analysis.ts)
// runs on the parsed fields, so the fill-rate score is consistent and auditable.

import Anthropic from "@anthropic-ai/sdk";
import { analyze } from "./analysis";
import { demoParse } from "./demoEngine";
import { OUTPUT_SCHEMA, SYSTEM_PROMPT, type LlmParseOutput } from "./prompt";
import type { ParsedShift, ShiftPostResult } from "./types";

const DEFAULT_MODEL = "claude-opus-4-8";

function toParsedShift(o: LlmParseOutput): ParsedShift {
  return {
    roleTitle: o.roleTitle,
    headcount: o.headcount,
    payRate: o.payRate,
    shiftTiming: o.shiftTiming,
    shiftLengthHours: o.shiftLengthHours,
    leadTimeHours: o.leadTimeHours,
    location: o.location,
    hasLogisticsDetail: o.hasLogisticsDetail,
    certifications: o.certifications,
    attire: o.attire,
  };
}

function assemble(
  o: LlmParseOutput,
  engine: "claude" | "demo",
  extra: { model?: string; fallbackReason?: ShiftPostResult["fallbackReason"] } = {},
): ShiftPostResult {
  const parsed = toParsedShift(o);
  const { benchmark, flags, readiness } = analyze(parsed);
  return {
    parsed,
    workerDescription: o.workerDescription,
    summary: o.summary,
    flags,
    benchmark,
    readiness,
    engine,
    model: extra.model,
    fallbackReason: extra.fallbackReason,
  };
}

async function parseWithClaude(request: string): Promise<{ output: LlmParseOutput; model: string }> {
  // Trim the key defensively — a stray leading/trailing space (easy to introduce
  // when pasting into a Vercel env var) would otherwise produce a 401.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY?.trim() });
  const model = process.env.SHIFT_ASSISTANT_MODEL?.trim() || DEFAULT_MODEL;

  const response = await client.messages.create({
    model,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: request }],
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const output = JSON.parse(text) as LlmParseOutput;
  return { output, model };
}

export async function generateShiftPost(request: string): Promise<ShiftPostResult> {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  if (hasKey) {
    try {
      const { output, model } = await parseWithClaude(request);
      return assemble(output, "claude", { model });
    } catch (err) {
      // Stay functional even if the API call fails, but record why so the UI
      // can tell "no key" apart from "key present but request failed".
      console.error("[shift-assistant] Claude generation failed, falling back to demo engine:", err);
      return assemble(demoParse(request), "demo", { fallbackReason: "claude_error" });
    }
  }

  return assemble(demoParse(request), "demo", { fallbackReason: "no_key" });
}
