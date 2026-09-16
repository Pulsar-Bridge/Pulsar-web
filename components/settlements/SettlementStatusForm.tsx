"use client";

import { useState } from "react";
import { updateSettlementStatus } from "../../lib/api/relay-client";
import { SETTLEMENT_STATUS_TRANSITIONS } from "../../lib/constants";
import type { RelaySettlement } from "../../lib/types";

interface Props {
  settlement: RelaySettlement;
  onUpdated: (updated: RelaySettlement) => void;
}

/**
 * PATCH /admin/settlements/:id/status is admin-key gated and server-side
 * enforces SETTLEMENT_TRANSITIONS — this form only offers the transitions
 * that state machine actually allows from the settlement's current status,
 * so a rejected transition should never reach the server in normal use.
 */
export function SettlementStatusForm({ settlement, onUpdated }: Props) {
  const nextStatuses = SETTLEMENT_STATUS_TRANSITIONS[settlement.status] ?? [];
  const [targetStatus, setTargetStatus] = useState(nextStatuses[0] ?? "");
  const [reason, setReason] = useState("");
  const [newTotal, setNewTotal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (nextStatuses.length === 0) {
    return <p className="text-xs text-[var(--foreground)]/50">No further status transitions from here.</p>;
  }

  async function handleSubmit() {
    if (!targetStatus) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateSettlementStatus(settlement.id, {
        status: targetStatus,
        reason: reason.trim() || undefined,
        new_total: targetStatus === "adjusted" && newTotal.trim() ? newTotal.trim() : undefined,
        actor: "dashboard-admin",
      });
      onUpdated(updated);
      setReason("");
      setNewTotal("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settlement status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <select
          value={targetStatus}
          onChange={(e) => setTargetStatus(e.target.value)}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 font-mono"
        >
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          disabled={busy}
          onClick={handleSubmit}
          className="rounded border border-[var(--border)] px-3 py-1 font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--background)]"
        >
          {busy ? "Updating…" : "Update status"}
        </button>
      </div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1"
      />
      {targetStatus === "adjusted" && (
        <input
          value={newTotal}
          onChange={(e) => setNewTotal(e.target.value)}
          placeholder="New total amount (optional)"
          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 font-mono"
        />
      )}
      {error && <p className="text-[var(--danger)]">{error}</p>}
    </div>
  );
}
