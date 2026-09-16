"use client";

import { useEffect, useState } from "react";
import {
  listTenantQuotas,
  RelayApiError,
  resetTenantQuota,
  setTenantQuota,
} from "../../lib/api/relay-client";
import { MOCK_TENANT_QUOTAS } from "../../lib/mock-data";
import type { RelayTenantQuota } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function TenantQuotasPanel() {
  const [quotas, setQuotas] = useState<RelayTenantQuota[]>(MOCK_TENANT_QUOTAS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    listTenantQuotas()
      .then((res) => {
        setQuotas(res);
        setSource("live");
      })
      .catch((err: unknown) => {
        setQuotas(MOCK_TENANT_QUOTAS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
  }

  useEffect(load, []);

  async function handleSetLimit(tenantId: string) {
    const raw = editing[tenantId];
    const parsed = Number(raw);
    if (!raw || !Number.isFinite(parsed) || parsed <= 0) return;
    setBusyTenantId(tenantId);
    setActionError(null);
    try {
      await setTenantQuota(tenantId, parsed);
      setEditing((prev) => ({ ...prev, [tenantId]: "" }));
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to set quota");
    } finally {
      setBusyTenantId(null);
    }
  }

  async function handleReset(tenantId: string) {
    setBusyTenantId(tenantId);
    setActionError(null);
    try {
      await resetTenantQuota(tenantId);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reset quota");
    } finally {
      setBusyTenantId(null);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Tenant quotas</h3>
      <DataSourceBanner source={source} detail={detail} />
      <ul className="space-y-2 text-xs">
        {quotas.map((q) => {
          const busy = busyTenantId === q.tenant_id;
          return (
            <li
              key={q.tenant_id}
              className="rounded border border-[var(--border)] bg-[var(--background)] p-2"
            >
              <div className="flex justify-between text-[var(--foreground)]/60">
                <span className="font-medium text-[var(--foreground)]">{q.name}</span>
                <span className="font-mono">{q.rate_limit_per_minute}/min limit</span>
              </div>
              {q.quota_status && (
                <p className="mt-1 text-[var(--foreground)]/50">
                  {q.quota_status.used}/{q.quota_status.limit} used this window · resets in{" "}
                  {q.quota_status.reset_in_seconds}s
                </p>
              )}
              {source === "live" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={editing[q.tenant_id] ?? ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [q.tenant_id]: e.target.value }))}
                    placeholder="New limit/min"
                    className="w-28 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono"
                  />
                  <button
                    disabled={busy || !editing[q.tenant_id]}
                    onClick={() => handleSetLimit(q.tenant_id)}
                    className="rounded border border-[var(--border)] px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--surface)]"
                  >
                    Set
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => handleReset(q.tenant_id)}
                    className="rounded border border-[var(--border)] px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--surface)]"
                  >
                    Reset window
                  </button>
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
