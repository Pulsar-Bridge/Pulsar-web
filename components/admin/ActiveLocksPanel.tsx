"use client";

import { useEffect, useState } from "react";
import { forceReleaseLock, listActiveLocks, RelayApiError } from "../../lib/api/relay-client";
import { MOCK_ACTIVE_LOCKS } from "../../lib/mock-data";
import type { RelayActiveLock } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function ActiveLocksPanel() {
  const [locks, setLocks] = useState<RelayActiveLock[]>(MOCK_ACTIVE_LOCKS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [confirmingResource, setConfirmingResource] = useState<string | null>(null);
  const [busyResource, setBusyResource] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    listActiveLocks()
      .then((res) => {
        setLocks(res.active_locks);
        setSource("live");
      })
      .catch((err: unknown) => {
        setLocks(MOCK_ACTIVE_LOCKS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
  }

  useEffect(load, []);

  async function handleForceRelease(resource: string) {
    setBusyResource(resource);
    setConfirmingResource(null);
    setActionError(null);
    try {
      await forceReleaseLock(resource);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to release lock");
    } finally {
      setBusyResource(null);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Active distributed locks</h3>
      <p className="mb-3 text-xs text-[var(--foreground)]/50">
        Per-instance snapshot — a lock held by another relay instance won&apos;t appear here.
      </p>
      <DataSourceBanner source={source} detail={detail} />
      {locks.length === 0 && <p className="text-xs text-[var(--foreground)]/50">No active locks.</p>}
      <ul className="space-y-2 text-xs">
        {locks.map((lock) => {
          const busy = busyResource === lock.resource;
          const confirming = confirmingResource === lock.resource;
          return (
            <li
              key={lock.resource}
              className="rounded border border-[var(--border)] bg-[var(--background)] p-2"
            >
              <div className="flex justify-between">
                <span className="font-mono text-[var(--foreground)]">{lock.resource}</span>
                <span className={lock.overdue ? "text-[var(--danger)]" : "text-[var(--foreground)]/60"}>
                  {lock.overdue ? "Overdue" : "Held"}
                </span>
              </div>
              <p className="mt-1 text-[var(--foreground)]/50">
                acquired {new Date(lock.acquired_at * 1000).toLocaleString()} · ttl {lock.ttl_secs}s ·
                expected {lock.expected_duration_secs}s
              </p>
              {source === "live" && (
                <div className="mt-2">
                  {confirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--warning)]">
                        Force-release even if still owned by an in-progress operation?
                      </span>
                      <button
                        disabled={busy}
                        onClick={() => handleForceRelease(lock.resource)}
                        className="rounded border border-[var(--danger)]/40 px-2 py-1 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                      >
                        {busy ? "Releasing…" : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmingResource(null)}
                        className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--surface)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingResource(lock.resource)}
                      className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--surface)]"
                    >
                      Force release
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {actionError && <p className="mt-2 text-xs text-[var(--danger)]">{actionError}</p>}
    </div>
  );
}
