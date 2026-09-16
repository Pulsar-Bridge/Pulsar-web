"use client";

import { useEffect, useState } from "react";
import { RelayApiError, searchAuditLogs } from "../../lib/api/relay-client";
import { MOCK_AUDIT_LOGS } from "../../lib/mock-data";
import type { RelayAuditLogRow } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function AuditLogPanel() {
  const [rows, setRows] = useState<RelayAuditLogRow[]>(MOCK_AUDIT_LOGS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    searchAuditLogs({ limit: 10 })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setSource("live");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRows(MOCK_AUDIT_LOGS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Recent audit log entries</h3>
      <DataSourceBanner source={source} detail={detail} />
      <ul className="space-y-2 text-xs">
        {rows.map((row) => (
          <li key={row.id} className="rounded border border-[var(--border)] bg-[var(--background)] p-2">
            <div className="flex justify-between text-[var(--foreground)]/60">
              <span>
                <span className="font-medium text-[var(--foreground)]">{row.action}</span> on{" "}
                {row.entity_type}
              </span>
              <span>{new Date(row.timestamp).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-[var(--foreground)]/50">by {row.actor}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
