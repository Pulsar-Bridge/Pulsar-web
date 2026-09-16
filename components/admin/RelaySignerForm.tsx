"use client";

import { useState } from "react";
import { setRelaySigner } from "../../lib/soroban/contract";
import { isValidStellarAddress } from "../../lib/validation";

interface Props {
  wallet: string | null;
  isAdmin: boolean;
  onRotated: () => void;
}

export function RelaySignerForm({ wallet, isAdmin, onRotated }: Props) {
  const [newSigner, setNewSigner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = newSigner.length === 0 || isValidStellarAddress(newSigner);
  const canSubmit = isAdmin && wallet !== null && newSigner.length > 0 && valid;

  async function handleSubmit() {
    if (!wallet || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await setRelaySigner(wallet, newSigner.trim());
      setNewSigner("");
      onRotated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "set_relay_signer failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Rotate relay signer</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newSigner}
          onChange={(e) => setNewSigner(e.target.value)}
          placeholder="New relay signer G... address"
          className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-mono"
        />
        <button
          disabled={!canSubmit || busy}
          onClick={handleSubmit}
          className="rounded border border-[var(--border)] px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--background)]"
        >
          {busy ? "Submitting…" : "Rotate"}
        </button>
      </div>
      {!valid && <p className="mt-2 text-xs text-[var(--danger)]">Not a valid Stellar address.</p>}
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
