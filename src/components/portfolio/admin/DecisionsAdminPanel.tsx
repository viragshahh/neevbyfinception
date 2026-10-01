"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Decision } from "@/lib/portfolio-db";
import { SECTORS } from "@/lib/sectors";

export default function DecisionsAdminPanel({ passcode }: { passcode: string }) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/decisions");
      const data = await res.json();
      setDecisions(data.decisions ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/portfolio/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode,
          date: formData.get("date"),
          sector: formData.get("sector"),
          companyName: formData.get("companyName"),
          symbol: formData.get("symbol"),
          decision: formData.get("decision"),
          rationale: formData.get("rationale"),
          voteCount: formData.get("voteCount"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save decision." });
        return;
      }
      setMessage({ type: "success", text: "Decision logged." });
      form.reset();
      await load();
    } catch {
      setMessage({ type: "error", text: "Failed to save decision. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this decision entry? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/portfolio/decisions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to delete." });
        return;
      }
      await load();
    } catch {
      setMessage({ type: "error", text: "Failed to delete." });
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-md border border-accent/30 bg-accent/5 p-4 text-sm text-muted">
        <span className="font-medium text-foreground">If a Decisions Google Sheet is configured</span>{" "}
        (<code className="font-mono text-accent">PORTFOLIO_DECISIONS_SHEET_CSV_URL</code>), the
        Decision Register reads from that sheet instead and entries added here are not shown. Leave
        the env var unset to manage decisions from this panel.
      </div>
      {message && (
        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-down/30 bg-down/5 text-down"
              : "border-up/30 bg-up/5 text-up"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Date</label>
          <input
            type="date"
            name="date"
            required
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Sector</label>
          <select
            name="sector"
            required
            defaultValue=""
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Select a sector
            </option>
            {SECTORS.map((s) => (
              <option key={s.slug} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Company Name (optional)
          </label>
          <input
            type="text"
            name="companyName"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Symbol (optional)
          </label>
          <input
            type="text"
            name="symbol"
            placeholder="e.g. RELIANCE.NS"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Decision</label>
          <select
            name="decision"
            required
            defaultValue=""
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="" disabled>
              Select
            </option>
            <option value="BUY">BUY</option>
            <option value="HOLD">HOLD</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Vote Count (optional)
          </label>
          <input
            type="text"
            name="voteCount"
            placeholder="e.g. 6-0"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Rationale</label>
          <textarea
            name="rationale"
            required
            rows={3}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-2 mt-1 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-[#070908] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Logging..." : "Log Decision"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-foreground">Decision Register</h3>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading...</p>
        ) : decisions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No decisions logged yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {decisions.map((d) => (
              <div key={d.id} className="card flex items-start justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    <span
                      className={
                        d.decision === "BUY"
                          ? "text-up"
                          : d.decision === "SELL"
                            ? "text-down"
                            : "text-muted"
                      }
                    >
                      {d.decision}
                    </span>{" "}
                    &middot; {d.companyName ?? d.sector}
                  </p>
                  <p className="text-xs text-muted">
                    {d.date} &middot; {d.sector}
                    {d.voteCount && ` · ${d.voteCount}`}
                  </p>
                  <p className="mt-1 text-muted">{d.rationale}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  className="shrink-0 text-sm text-down hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
