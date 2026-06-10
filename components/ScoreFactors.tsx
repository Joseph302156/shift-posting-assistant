import type { ScoreFactor } from "@/lib/types";

function barColor(ratio: number): string {
  if (ratio >= 0.75) return "var(--color-brand)";
  if (ratio >= 0.45) return "var(--color-warn)";
  return "var(--color-danger)";
}

export function ScoreFactors({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="space-y-3">
      {factors.map((f) => {
        const ratio = f.max === 0 ? 0 : f.earned / f.max;
        return (
          <div key={f.label}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-ink">{f.label}</span>
              <span className="text-xs tabular-nums text-ink-soft/60">
                {f.earned}/{f.max}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${ratio * 100}%`,
                  backgroundColor: barColor(ratio),
                  transition: "width 0.5s ease-out",
                }}
              />
            </div>
            <p className="mt-1 text-xs leading-snug text-ink-soft/70">{f.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
