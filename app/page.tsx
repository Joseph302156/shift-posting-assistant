"use client";

import { useState } from "react";
import { EXAMPLES } from "@/lib/examples";
import type { ShiftPostResult } from "@/lib/types";
import { ResultView } from "@/components/ResultView";

export default function Home() {
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<ShiftPostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed.");
      setResult(data as ShiftPostResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function useExample(text: string) {
    setRequest(text);
    void generate(text);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            S
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft/50">
            Shift-Posting Assistant
          </span>
        </div>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Describe the shift. Get a post that actually fills.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft/75">
          Type a staffing need in plain English. The assistant structures it into a Traba-ready shift post,
          rewrites the description to attract reliable workers, and scores its{" "}
          <span className="font-medium text-ink">fill-rate readiness</span> — flagging exactly what to fix
          before it goes live.
        </p>
      </header>

      {/* Input */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <label htmlFor="request" className="text-sm font-medium text-ink">
          What do you need staffed?
        </label>
        <textarea
          id="request"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void generate(request);
          }}
          rows={3}
          placeholder="e.g. Need 12 forklift-certified workers overnight Tuesday near the Dallas DC, $24/hr, steel-toe boots required…"
          className="mt-2 w-full resize-y rounded-xl border border-line bg-paper/50 p-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-soft/50">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => useExample(ex.text)}
              disabled={loading}
              className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink-soft/80 transition hover:border-brand hover:text-brand-dark disabled:opacity-50"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void generate(request)}
            disabled={loading || !request.trim()}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate shift post"}
          </button>
          <span className="text-xs text-ink-soft/40">⌘/Ctrl + Enter</span>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}
      </section>

      {/* Results */}
      <div className="mt-8">
        {result ? (
          <ResultView result={result} />
        ) : (
          !loading && (
            <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-ink-soft/50">
              Your structured post, worker preview, and fill-rate analysis will appear here.
            </p>
          )
        )}
      </div>

      <footer className="mt-12 border-t border-line pt-5 text-xs leading-relaxed text-ink-soft/50">
        An independent concept project exploring how Traba could turn messy staffing requests into
        reliability-optimized posts. Runs out-of-the-box on a built-in demo engine; set{" "}
        <code className="rounded bg-ink/5 px-1 py-0.5">ANTHROPIC_API_KEY</code> to parse with the Claude API.
      </footer>
    </main>
  );
}
