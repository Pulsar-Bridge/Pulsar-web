"use client";

import { useEffect, useState } from "react";
import { getTransaction, RelayApiError } from "../../../lib/api/relay-client";
import { fetchOnChainTransaction, isContractConfigured } from "../../../lib/soroban/contract";
import { MOCK_TXS } from "../../../lib/mock-data";
import type { OnChainTransaction, RelayTransaction } from "../../../lib/types";
import { StatusBadge } from "../../ui/StatusBadge";

interface Props {
  txId: string;
  onClose: () => void;
}

type Slot<T> = { state: "loading" } | { state: "ok"; value: T } | { state: "error"; message: string };

/**
 * Cross-references the relay's off-chain DB row with the on-chain record for
 * the same transaction ID, so a mismatch (e.g. relay says Completed but the
 * contract still shows Processing) is visible rather than silently trusted
 * from a single source.
 */
export function TransactionDetail({ txId, onClose }: Props) {
  const contractConfigured = isContractConfigured();
  const [relay, setRelay] = useState<Slot<RelayTransaction>>({ state: "loading" });
  const [onChain, setOnChain] = useState<Slot<OnChainTransaction>>(
    contractConfigured
      ? { state: "loading" }
      : { state: "error", message: "NEXT_PUBLIC_CONTRACT_ID not set" },
  );

  useEffect(() => {
    let cancelled = false;

    getTransaction(txId)
      .then((tx) => !cancelled && setRelay({ state: "ok", value: tx }))
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof RelayApiError && err.status === 503) {
          const mock = MOCK_TXS.find((t) => t.id === txId);
          if (mock) {
            setRelay({ state: "ok", value: mock });
            return;
          }
        }
        setRelay({ state: "error", message: err instanceof Error ? err.message : "failed to load" });
      });

    if (contractConfigured) {
      fetchOnChainTransaction(txId)
        .then((tx) => !cancelled && setOnChain({ state: "ok", value: tx }))
        .catch(
          (err: unknown) =>
            !cancelled &&
            setOnChain({ state: "error", message: err instanceof Error ? err.message : "failed" }),
        );
    }

    return () => {
      cancelled = true;
    };
  }, [txId, contractConfigured]);

  const mismatch =
    relay.state === "ok" &&
    onChain.state === "ok" &&
    relay.value.status.toLowerCase() !== onChain.value.status.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Transaction {txId.slice(0, 12)}…</h3>
          <button
            onClick={onClose}
            className="text-xs text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
          >
            Close
          </button>
        </div>

        {mismatch && (
          <div className="mb-4 rounded-md border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-2 text-xs text-[var(--warning)]">
            Status mismatch: relay and on-chain disagree. This can be transient (on-chain confirmation lags
            the relay&apos;s own state machine) — re-check before treating either as final.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Panel title="Relay (off-chain DB)">
            {relay.state === "loading" && <p className="text-xs text-[var(--foreground)]/50">Loading…</p>}
            {relay.state === "error" && <p className="text-xs text-[var(--danger)]">{relay.message}</p>}
            {relay.state === "ok" && (
              <dl className="space-y-1 text-xs">
                <Row label="Status">
                  <StatusBadge status={relay.value.status} />
                </Row>
                <Row label="Amount">{relay.value.amount}</Row>
                <Row label="Asset">{relay.value.asset_code}</Row>
                <Row label="Account">{relay.value.stellar_account}</Row>
                <Row label="Updated">{new Date(relay.value.updated_at).toLocaleString()}</Row>
              </dl>
            )}
          </Panel>

          <Panel title="On-chain (SynapseCoreContract)">
            {onChain.state === "loading" && <p className="text-xs text-[var(--foreground)]/50">Loading…</p>}
            {onChain.state === "error" && (
              <p className="text-xs text-[var(--foreground)]/50">{onChain.message}</p>
            )}
            {onChain.state === "ok" && (
              <dl className="space-y-1 text-xs">
                <Row label="Status">
                  <StatusBadge status={onChain.value.status} />
                </Row>
                <Row label="Amount (stroops)">{onChain.value.amount.toString()}</Row>
                <Row label="Asset">{onChain.value.asset_code}</Row>
                <Row label="Account">{onChain.value.stellar_account}</Row>
                <Row label="Settlement tx hash">{onChain.value.stellar_tx_hash || "—"}</Row>
              </dl>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <h4 className="mb-2 text-xs font-medium uppercase text-[var(--foreground)]/50">{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[var(--foreground)]/50">{label}</dt>
      <dd className="truncate font-mono">{children}</dd>
    </div>
  );
}
