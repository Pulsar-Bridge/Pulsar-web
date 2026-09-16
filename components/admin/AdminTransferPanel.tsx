"use client";

import { useEffect, useState } from "react";
import { acceptAdmin, fetchPendingAdmin, proposeAdmin } from "../../lib/soroban/contract";
import { isValidStellarAddress } from "../../lib/validation";

interface Props {
  wallet: string | null;
  isAdmin: boolean;
  onTransferred: () => void;
}

/**
 * UI for the contract's two-step admin transfer (propose_admin / accept_admin).
 * A single propose_admin call can never finish the transfer on its own — the
 * nominee must separately call accept_admin with their own wallet — so this
 * panel exposes both halves rather than assuming the connected wallet can do
 * everything in one step.
 */
export function AdminTransferPanel({ wallet, isAdmin, onTransferred }: Props) {
  const [pending, setPending] = useState<string | null | "unknown">("unknown");
  const [nominee, setNominee] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingAdmin()
      .then(setPending)
      .catch(() => setPending("unknown"));
  }, [wallet]);

  const nomineeValid = nominee.length === 0 || isValidStellarAddress(nominee);
  const canPropose = isAdmin && wallet !== null && nominee.length > 0 && nomineeValid;
  const canAccept = wallet !== null && pending !== "unknown" && pending !== null && wallet === pending;

  async function handlePropose() {
    if (!wallet || !canPropose) return;
    setBusy(true);
    setError(null);
    try {
      await proposeAdmin(wallet, nominee.trim());
      setNominee("");
      const refreshed = await fetchPendingAdmin();
      setPending(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "propose_admin failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept() {
    if (!wallet || !canAccept) return;
    setBusy(true);
    setError(null);
    try {
      await acceptAdmin(wallet);
      setPending(null);
      onTransferred();
    } catch (err) {
      setError(err instanceof Error ? err.message : "accept_admin failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Admin transfer</h3>

      <p className="mb-3 text-xs text-[var(--foreground)]/60">
        Pending nominee:{" "}
        <span className="font-mono">{pending === "unknown" ? "…" : pending === null ? "none" : pending}</span>
      </p>

      {isAdmin && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={nominee}
            onChange={(e) => setNominee(e.target.value)}
            placeholder="New admin G... address"
            className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-mono"
          />
          <button
            disabled={!canPropose || busy}
            onClick={handlePropose}
            className="rounded border border-[var(--border)] px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--background)]"
          >
            Propose
          </button>
        </div>
      )}
      {!nomineeValid && <p className="mb-2 text-xs text-[var(--danger)]">Not a valid Stellar address.</p>}

      {canAccept && (
        <button
          disabled={busy}
          onClick={handleAccept}
          className="rounded bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white disabled:opacity-40 hover:opacity-90"
        >
          Accept admin (connected wallet is the pending nominee)
        </button>
      )}

      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
