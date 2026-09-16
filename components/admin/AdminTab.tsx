"use client";

import { useEffect, useState } from "react";
import { fetchContractInfo, pauseContract, unpauseContract } from "../../lib/soroban/contract";
import { MOCK_CONTRACT_INFO } from "../../lib/mock-data";
import type { ContractInfo } from "../../lib/types";
import { connectWallet } from "../../lib/wallet";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";
import { AdminTransferPanel } from "./AdminTransferPanel";
import { RelaySignerForm } from "./RelaySignerForm";

export function AdminTab() {
  const [info, setInfo] = useState<ContractInfo>(MOCK_CONTRACT_INFO);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [wallet, setWallet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function loadContractInfo() {
    fetchContractInfo()
      .then((live) => {
        setInfo(live);
        setSource("live");
        setDetail(undefined);
      })
      .catch((err: unknown) => {
        setInfo(MOCK_CONTRACT_INFO);
        setSource(err instanceof Error && err.name === "ContractNotConfiguredError" ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
  }

  useEffect(() => {
    loadContractInfo();
  }, []);

  const isAdmin = wallet !== null && source === "live" && wallet === info.admin;

  async function handleConnect() {
    try {
      const { address } = await connectWallet();
      setWallet(address);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  }

  async function handleTogglePause() {
    if (!wallet) return;
    setBusy(true);
    setActionError(null);
    try {
      if (info.isPaused) {
        await unpauseContract(wallet);
      } else {
        await pauseContract(wallet);
      }
      // Re-read from chain rather than assuming success client-side.
      loadContractInfo();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <DataSourceBanner source={source} detail={detail} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow label="Admin" value={info.admin} mono />
        <InfoRow label="Relay signer" value={info.relaySigner} mono />
        <InfoRow label="Paused" value={info.isPaused ? "Yes" : "No"} />
        <InfoRow label="Initialised" value={info.isInitialised ? "Yes" : "No"} />
        <InfoRow label="Schema version" value={String(info.schemaVersion)} />
        <InfoRow label="Contract version" value={info.version} />
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Admin actions</h3>
        {!wallet ? (
          <button
            onClick={handleConnect}
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Connect wallet
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[var(--foreground)]/60">
              Connected: <span className="font-mono">{wallet}</span>
            </p>
            {!isAdmin && (
              <p className="text-xs text-[var(--warning)]">
                Connected wallet is not the on-chain admin — pause/unpause is disabled.
              </p>
            )}
            <button
              disabled={!isAdmin || busy}
              onClick={handleTogglePause}
              className="rounded border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--background)]"
            >
              {busy ? "Submitting…" : info.isPaused ? "Unpause contract" : "Pause contract"}
            </button>
          </div>
        )}
        {actionError && <p className="mt-2 text-xs text-[var(--danger)]">{actionError}</p>}
      </section>

      {source === "live" && (
        <>
          <AdminTransferPanel wallet={wallet} isAdmin={isAdmin} onTransferred={loadContractInfo} />
          <RelaySignerForm wallet={wallet} isAdmin={isAdmin} onRotated={loadContractInfo} />
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xs uppercase text-[var(--foreground)]/50">{label}</p>
      <p className={`mt-1 truncate text-sm ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}
