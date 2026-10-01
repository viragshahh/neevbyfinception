"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Holding } from "@/lib/portfolio-db";
import { SECTORS } from "@/lib/sectors";

export default function HoldingsAdminPanel({ passcode }: { passcode: string }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [exitDate, setExitDate] = useState("");
  const [exitPrice, setExitPrice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/holdings");
      const data = await res.json();
      setHoldings(data.holdings ?? []);
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
      const res = await fetch("/api/portfolio/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode,
          symbol: formData.get("symbol"),
          companyName: formData.get("companyName"),
          sector: formData.get("sector"),
          quantity: formData.get("quantity"),
          avgCost: formData.get("avgCost"),
          entryDate: formData.get("entryDate"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to add holding." });
        return;
      }
      setMessage({ type: "success", text: "Holding added." });
      form.reset();
      await load();
    } catch {
      setMessage({ type: "error", text: "Failed to add holding. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExitSubmit(id: string) {
    if (!exitDate || !exitPrice) {
      setMessage({ type: "error", text: "Enter both exit date and exit price." });
      return;
    }
    try {
      const res = await fetch("/api/portfolio/holdings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, id, exitDate, exitPrice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to exit holding." });
        return;
      }
      setExitingId(null);
      setExitDate("");
      setExitPrice("");
      await load();
    } catch {
      setMessage({ type: "error", text: "Failed to exit holding." });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this holding? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/portfolio/holdings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to delete holding." });
        return;
      }
      await load();
    } catch {
      setMessage({ type: "error", text: "Failed to delete holding." });
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-md border border-accent/30 bg-accent/5 p-4 text-sm text-muted">
        <span className="font-medium text-foreground">If a Holdings Google Sheet is configured</span>{" "}
        (<code className="font-mono text-accent">PORTFOLIO_HOLDINGS_SHEET_CSV_URL</code>), the site
        reads holdings from that sheet instead and entries added here are not shown. Leave the env
        var unset to manage holdings from this panel.
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
          <label className="mb-1.5 block text-sm font-medium text-foreground">Symbol</label>
          <input
            type="text"
            name="symbol"
            required
            placeholder="e.g. RELIANCE.NS"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Company Name</label>
          <input
            type="text"
            name="companyName"
            required
            placeholder="e.g. Reliance Industries"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
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
          <label className="mb-1.5 block text-sm font-medium text-foreground">Entry Date</label>
          <input
            type="date"
            name="entryDate"
            required
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Quantity</label>
          <input
            type="number"
            name="quantity"
            step="any"
            required
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Average Cost</label>
          <input
            type="number"
            name="avgCost"
            step="any"
            required
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-2 mt-1 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-[#070908] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add Holding"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-foreground">All Holdings</h3>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading...</p>
        ) : holdings.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No holdings yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {holdings.map((h) => (
              <div key={h.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {h.companyName}{" "}
                      <span className="font-mono text-xs text-muted">{h.symbol}</span>
                      {h.status === "exited" && (
                        <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                          Exited
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {h.sector} &middot; {h.quantity} @ {h.avgCost} &middot; entered {h.entryDate}
                      {h.status === "exited" && ` · exited ${h.exitDate} @ ${h.exitPrice}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {h.status === "active" && exitingId !== h.id && (
                      <button
                        type="button"
                        onClick={() => setExitingId(h.id)}
                        className="text-sm text-accent hover:underline"
                      >
                        Exit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(h.id)}
                      className="text-sm text-down hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {exitingId === h.id && (
                  <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted">Exit Date</label>
                      <input
                        type="date"
                        value={exitDate}
                        onChange={(e) => setExitDate(e.target.value)}
                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted">Exit Price</label>
                      <input
                        type="number"
                        step="any"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className="w-28 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExitSubmit(h.id)}
                      className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-[#070908]"
                    >
                      Confirm Exit
                    </button>
                    <button
                      type="button"
                      onClick={() => setExitingId(null)}
                      className="text-sm text-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
