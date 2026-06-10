import type { FillReadiness } from "@/lib/types";

const BAND_META: Record<FillReadiness["band"], { label: string; color: string; ring: string }> = {
  strong: { label: "Strong", color: "var(--color-brand)", ring: "text-brand" },
  moderate: { label: "Moderate", color: "var(--color-warn)", ring: "text-warn" },
  "at-risk": { label: "At risk", color: "var(--color-danger)", ring: "text-danger" },
};

export function ReadinessGauge({ readiness }: { readiness: FillReadiness }) {
  const { score, band, projectedFillRate, suggestedBuffer } = readiness;
  const meta = BAND_META[band];

  // Semicircle arc gauge.
  const radius = 84;
  const circumference = Math.PI * radius; // half circle
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="200" height="118" viewBox="0 0 200 118" aria-hidden>
          {/* track */}
          <path
            d="M 16 108 A 84 84 0 0 1 184 108"
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* value */}
          <path
            d="M 16 108 A 84 84 0 0 1 184 108"
            fill="none"
            stroke={meta.color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-5xl font-bold tabular-nums leading-none" style={{ color: meta.color }}>
            {score}
          </span>
          <span className="text-xs font-medium text-ink-soft/60">/ 100</span>
        </div>
      </div>

      <div
        className="mt-1 rounded-full px-3 py-1 text-sm font-semibold"
        style={{ color: meta.color, backgroundColor: `color-mix(in srgb, ${meta.color} 14%, white)` }}
      >
        {meta.label} fill-rate readiness
      </div>

      <div className="mt-5 grid w-full grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-paper/60 p-3 text-center">
          <div className="text-2xl font-bold tabular-nums">{projectedFillRate}%</div>
          <div className="mt-0.5 text-xs text-ink-soft/70">Projected fill rate</div>
        </div>
        <div className="rounded-xl border border-line bg-paper/60 p-3 text-center">
          <div className="text-2xl font-bold tabular-nums">
            {suggestedBuffer > 0 ? `+${suggestedBuffer}` : "—"}
          </div>
          <div className="mt-0.5 text-xs text-ink-soft/70">Suggested buffer</div>
        </div>
      </div>
    </div>
  );
}
