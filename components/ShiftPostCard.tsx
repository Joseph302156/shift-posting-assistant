import type { ParsedShift, PayBenchmark } from "@/lib/types";

function Row({
  label,
  children,
  missing,
}: {
  label: string;
  children: React.ReactNode;
  missing?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-ink-soft/60">{label}</span>
      <span className={`text-right text-sm font-medium ${missing ? "text-danger/70" : "text-ink"}`}>
        {children}
      </span>
    </div>
  );
}

const NS = <span className="italic text-danger/60">Not specified</span>;

export function ShiftPostCard({
  parsed,
  benchmark,
}: {
  parsed: ParsedShift;
  benchmark: PayBenchmark;
}) {
  return (
    <div>
      <Row label="Role">{parsed.roleTitle}</Row>
      <Row label="Workers needed" missing={parsed.headcount == null}>
        {parsed.headcount ?? NS}
      </Row>
      <Row label="Pay rate" missing={parsed.payRate == null}>
        {parsed.payRate != null ? (
          <span>
            ${parsed.payRate}
            <span className="text-ink-soft/50">/hr</span>
            {benchmark.deltaPct != null && (
              <span
                className="ml-2 text-xs font-semibold"
                style={{ color: benchmark.deltaPct >= 0 ? "var(--color-brand)" : "var(--color-warn)" }}
              >
                {benchmark.deltaPct >= 0 ? "+" : ""}
                {benchmark.deltaPct}% vs market
              </span>
            )}
          </span>
        ) : (
          NS
        )}
      </Row>
      <Row label="Schedule" missing={parsed.shiftTiming == null}>
        {parsed.shiftTiming ?? NS}
      </Row>
      <Row label="Shift length">
        {parsed.shiftLengthHours != null ? `${parsed.shiftLengthHours} hrs` : <span className="text-ink-soft/40">—</span>}
      </Row>
      <Row label="Location" missing={parsed.location == null}>
        {parsed.location ?? NS}
      </Row>
      <Row label="Certifications">
        {parsed.certifications.length > 0 ? (
          <span className="flex flex-wrap justify-end gap-1">
            {parsed.certifications.map((c) => (
              <span key={c} className="rounded-md bg-ink/5 px-1.5 py-0.5 text-xs">
                {c}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-ink-soft/40">None</span>
        )}
      </Row>
      <Row label="Required attire" missing={parsed.attire == null}>
        {parsed.attire ?? NS}
      </Row>
    </div>
  );
}
