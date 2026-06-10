import type { FieldFlag, FlagStatus } from "@/lib/types";

const STATUS_META: Record<FlagStatus, { color: string; soft: string; glyph: string; word: string }> = {
  ok: { color: "var(--color-brand)", soft: "var(--color-brand-soft)", glyph: "✓", word: "Good" },
  weak: { color: "var(--color-warn)", soft: "var(--color-warn-soft)", glyph: "!", word: "Improve" },
  missing: { color: "var(--color-danger)", soft: "var(--color-danger-soft)", glyph: "✕", word: "Missing" },
};

const IMPACT_LABEL = { high: "High impact", medium: "Med impact", low: "Low impact" } as const;

export function FieldFlags({ flags }: { flags: FieldFlag[] }) {
  // Surface problems first; within that, high-impact first.
  const order: Record<FlagStatus, number> = { missing: 0, weak: 1, ok: 2 };
  const impactOrder = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...flags].sort(
    (a, b) => order[a.status] - order[b.status] || impactOrder[a.impact] - impactOrder[b.impact],
  );

  return (
    <ul className="space-y-2">
      {sorted.map((flag) => {
        const meta = STATUS_META[flag.status];
        return (
          <li key={flag.field + flag.label} className="flex gap-3 rounded-xl border border-line bg-white p-3">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ color: meta.color, backgroundColor: meta.soft }}
              aria-hidden
            >
              {meta.glyph}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-ink">{flag.label}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: meta.color, backgroundColor: meta.soft }}
                >
                  {meta.word}
                </span>
                {flag.status !== "ok" && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-ink-soft/45">
                    {IMPACT_LABEL[flag.impact]}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft/80">{flag.message}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
