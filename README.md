# Shift-Posting Assistant

Turn a plain-English staffing request into a **reliability-optimized shift post**, with a transparent fill-rate readiness score that flags exactly what to fix before the shift goes live.

> A manager types: _"Need 12 forklift-certified workers overnight Tuesday near the Dallas DC, $24/hr, steel-toe boots required."_
> The assistant returns a structured shift post, a worker-facing description rewritten to attract reliable talent, and an **82 / 100 fill-rate readiness** score — flagging the overnight no-show risk and the missing lead time.

This is a concept project built around the hardest problem in shift-based, light-industrial staffing: **reliability**. On-demand staffing marketplaces live or die on whether posted shifts actually fill and whether the people who claim them show up. Traditional staffing fills a fraction of roles slowly; modern marketplaces aim for near-complete fill with low no-shows. So the product question I found compelling is: _what makes a single shift post likely to fill — and how early can you tell?_ This tool is one answer, pointed at the moment a business creates a shift.

---

## What it does

It sits at the shift-creation step and does three things:

1. **Structures** a messy, free-text request into clean fields — role, headcount, pay, schedule, location, certifications, attire.
2. **Rewrites** the role description to be honest and attractive to workers (a "worker view" preview shows how it would look in a worker app).
3. **Scores** fill-rate readiness against the real drivers of reliability — pay vs. local market, lead time, posting completeness, site-logistics clarity, and shift desirability — then suggests an over-book buffer sized to the projected no-show rate.

The goal is a tool a staffing operations manager would actually want: it turns a one-line request into a complete, reliability-aware post and tells them what to improve.

---

## How the fill-rate score works (and why it's not a black box)

The language model **only parses** the request into structured fields and writes copy. It never invents the score. The reliability analysis is a **transparent, rules-based engine** ([`lib/analysis.ts`](lib/analysis.ts)) that runs identically whether the parse came from Claude or the built-in demo engine. Every point is explained in the UI:

| Factor | Weight | Rationale |
| --- | --- | --- |
| Pay competitiveness | 30 | Pay vs. local-market median is the top driver of whether workers claim a shift. |
| Posting completeness | 25 | Five core fields present (pay, headcount, time, location, attire). |
| Lead time | 20 | More advance notice → more time to claim and plan → higher fill. |
| Shift desirability | 15 | Overnight / early shifts no-show more; a pay premium offsets it. |
| Site logistics clarity | 10 | Parking/entrance/report-to details prevent late starts and turnarounds. |

The 0–100 score maps to an illustrative projected fill rate, and the suggested buffer is the expected no-shows on the requested headcount.

## An honest note on data

The pay benchmarks ([`lib/marketRates.ts`](lib/marketRates.ts)) are **synthetic** — illustrative figures within a typical light-industrial wage band, there to make the analysis tangible. With real shift-history data, those benchmarks and the scoring weights would be **learned from actual fill outcomes** rather than hand-set. I'd rather state that plainly than pretend otherwise.

---

## Running it

Works out of the box — no API key required (it falls back to a deterministic demo parser):

```bash
npm install
npm run dev          # http://localhost:3000
```

For real language understanding, point it at Claude:

```bash
cp .env.example .env.local
# set ANTHROPIC_API_KEY=...  (uses claude-opus-4-8 by default)
npm run dev
```

The UI badges every result with which engine produced it (**Claude** vs **Demo engine**), so it's always clear what you're looking at.

## Architecture

```
app/
  page.tsx                 UI (client) — input, examples, results
  api/generate/route.ts    POST endpoint
lib/
  prompt.ts                Claude system prompt + structured-output JSON schema
  generate.ts              Orchestration: Claude path + demo fallback → shared analysis
  demoEngine.ts            Deterministic, dependency-free parser (no-API-key fallback)
  analysis.ts              Transparent reliability scoring (shared by both paths)
  marketRates.ts           Synthetic pay benchmarks (clearly labeled)
components/                ReadinessGauge, ScoreFactors, FieldFlags, ShiftPostCard, WorkerPreview
```

Key design choice: the LLM is confined to parsing + copywriting; all scoring is deterministic and auditable. That keeps the reliability number defensible — exactly what you'd want in a product whose entire promise is reliability.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Anthropic SDK (`claude-opus-4-8`, structured outputs).
