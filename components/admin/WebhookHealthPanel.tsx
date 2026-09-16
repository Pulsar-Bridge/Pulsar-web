"use client";

import { useEffect, useState } from "react";
import { listWebhookHealth, RelayApiError } from "../../lib/api/relay-client";
import { MOCK_WEBHOOK_HEALTH } from "../../lib/mock-data";
import type { RelayWebhookEndpointHealth } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function WebhookHealthPanel() {
  const [rows, setRows] = useState<RelayWebhookEndpointHealth[]>(MOCK_WEBHOOK_HEALTH);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    listWebhookHealth()
      .then((res) => {
        if (cancelled) return;
        setRows(res);
        setSource("live");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRows(MOCK_WEBHOOK_HEALTH);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Webhook endpoint health</h3>
      <DataSourceBanner source={source} detail={detail} />
      <ul className="space-y-2 text-xs">
        {rows.map((row) => (
          <li key={row.id} className="rounded border border-[var(--border)] bg-[var(--background)] p-2">
            <div className="flex justify-between text-[var(--foreground)]/60">
              <span className="truncate font-mono text-[var(--foreground)]" title={row.url}>
                {row.url}
              </span>
              <span className={row.enabled ? "text-[var(--foreground)]/60" : "text-[var(--warning)]"}>
                {row.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-[var(--foreground)]/50">
              <span className={row.success_rate < 90 ? "text-[var(--danger)]" : ""}>
                {row.success_rate.toFixed(1)}% success · {row.total_deliveries} deliveries
              </span>
              <span>
                {row.last_success_at
                  ? `Last success ${new Date(row.last_success_at).toLocaleString()}`
                  : "No successful deliveries"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
