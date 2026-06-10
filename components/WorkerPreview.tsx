import type { ParsedShift } from "@/lib/types";

// A mock of how the generated post would appear to a worker browsing shifts in
// the Traba worker app — the "is this attractive enough to claim?" view.
export function WorkerPreview({
  parsed,
  description,
}: {
  parsed: ParsedShift;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between bg-ink px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Worker view</span>
        <span className="text-xs text-white/50">Traba</span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-ink">{parsed.roleTitle}</h4>
            {parsed.location && <p className="text-sm text-ink-soft/60">{parsed.location}</p>}
          </div>
          {parsed.payRate != null && (
            <div className="text-right">
              <div className="text-xl font-bold text-brand">${parsed.payRate}</div>
              <div className="-mt-1 text-xs text-ink-soft/50">/hour</div>
            </div>
          )}
        </div>

        {parsed.shiftTiming && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-paper px-2.5 py-1 text-sm text-ink-soft">
            <span aria-hidden>🕑</span>
            {parsed.shiftTiming}
            {parsed.shiftLengthHours != null && (
              <span className="text-ink-soft/50">· {parsed.shiftLengthHours}h</span>
            )}
          </div>
        )}

        <p className="mt-3 text-sm leading-relaxed text-ink-soft/90">{description}</p>

        {(parsed.certifications.length > 0 || parsed.attire) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {parsed.certifications.map((c) => (
              <span key={c} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark">
                {c}
              </span>
            ))}
            {parsed.attire && (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink-soft/70">{parsed.attire}</span>
            )}
          </div>
        )}

        <button
          type="button"
          disabled
          className="mt-4 w-full cursor-default rounded-xl bg-brand py-2.5 text-sm font-semibold text-white opacity-95"
        >
          Claim shift
        </button>
      </div>
    </div>
  );
}
