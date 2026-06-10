import type { ShiftPostResult } from "@/lib/types";
import { ReadinessGauge } from "./ReadinessGauge";
import { ScoreFactors } from "./ScoreFactors";
import { FieldFlags } from "./FieldFlags";
import { ShiftPostCard } from "./ShiftPostCard";
import { WorkerPreview } from "./WorkerPreview";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft/70">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-soft/50">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function ResultView({ result }: { result: ShiftPostResult }) {
  const problems = result.flags.filter((f) => f.status !== "ok").length;

  return (
    <div className="animate-rise space-y-5">
      {/* headline */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/50">Structured shift post</p>
          <p className="mt-0.5 font-semibold text-ink">{result.summary}</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            color: result.engine === "claude" ? "var(--color-brand-dark)" : "var(--color-ink-soft)",
            backgroundColor: result.engine === "claude" ? "var(--color-brand-soft)" : "var(--color-line)",
          }}
          title={
            result.engine === "claude"
              ? `Parsed with the Claude API (${result.model})`
              : "Parsed with the built-in demo engine (no API key set)"
          }
        >
          {result.engine === "claude" ? `✦ Claude · ${result.model}` : "Demo engine"}
        </span>
      </div>

      {result.engine === "demo" && (
        <div className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn-soft/50 px-4 py-3 text-xs leading-relaxed text-ink-soft/80">
          <span aria-hidden className="mt-0.5 text-warn">ⓘ</span>
          <span>
            Running on the built-in <strong>demo engine</strong> — a lightweight pattern matcher used when no API
            key is set. It can miss unusual phrasing. Set{" "}
            <code className="rounded bg-ink/5 px-1 py-0.5">ANTHROPIC_API_KEY</code> (see{" "}
            <code className="rounded bg-ink/5 px-1 py-0.5">.env.example</code>) to parse with the Claude API, which
            understands free-form requests far more reliably.
          </span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* LEFT: the post + worker preview */}
        <div className="space-y-5">
          <Card title="Shift post" subtitle="Structured from the request. Gaps are flagged in red.">
            <ShiftPostCard parsed={result.parsed} benchmark={result.benchmark} />
          </Card>

          <Card title="How workers see it" subtitle="Description rewritten to attract reliable talent.">
            <WorkerPreview parsed={result.parsed} description={result.workerDescription} />
          </Card>
        </div>

        {/* RIGHT: reliability analysis */}
        <div className="space-y-5">
          <Card
            title="Fill-rate readiness"
            subtitle="A transparent, rules-based score — not a black box."
          >
            <ReadinessGauge readiness={result.readiness} />
            <div className="mt-5 border-t border-line pt-4">
              <ScoreFactors factors={result.readiness.factors} />
            </div>
          </Card>

          <Card
            title={`Fix list${problems > 0 ? ` · ${problems} to improve` : ""}`}
            subtitle="Each item is tied to why it moves fill rate."
          >
            <FieldFlags flags={result.flags} />
          </Card>
        </div>
      </div>

      <p className="px-1 text-xs leading-relaxed text-ink-soft/50">
        Pay benchmarks are <strong>synthetic</strong>, illustrative figures within Traba&apos;s published
        $13–$38/hr band — not real Traba data. The readiness score is computed by a transparent rules engine
        ({result.readiness.score}/100 here), and the projected fill rate is anchored to the public industry
        contrast (traditional agencies ~46–59% vs. Traba&apos;s ~98%). With real shift history, these benchmarks
        and weights would be learned from outcomes.
      </p>
    </div>
  );
}
