"use client";

import { Fragment, useEffect, useState } from "react";
import { listSettlements, RelayApiError } from "../../lib/api/relay-client";
import { MOCK_SETTLEMENTS } from "../../lib/mock-data";
import type { RelaySettlement } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";
import { StatusBadge } from "../ui/StatusBadge";
import { SettlementStatusForm } from "./SettlementStatusForm";

export function SettlementsTab() {
  const [settlements, setSettlements] = useState<RelaySettlement[]>(MOCK_SETTLEMENTS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleStatusUpdated(updated: RelaySettlement) {
    setSettlements((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  useEffect(() => {
    let cancelled = false;
    listSettlements({ limit: 25 })
      .then((res) => {
        if (cancelled) return;
        setSettlements(res.settlements);
        setSource("live");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSettlements(MOCK_SETTLEMENTS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <DataSourceBanner source={source} detail={detail} />
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--foreground)]/60">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Asset</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Tx Count</th>
              <th className="px-4 py-2">Period</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && settlements.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--foreground)]/50" colSpan={6}>
                  Loading settlements…
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <Fragment key={s.id}>
                  <tr
                    className={`border-t border-[var(--border)] ${
                      source === "live" ? "cursor-pointer hover:bg-[var(--surface)]" : ""
                    }`}
                    onClick={() => source === "live" && setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    <td className="px-4 py-2 font-mono text-xs">{s.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2">{s.asset_code}</td>
                    <td className="px-4 py-2">{s.total_amount}</td>
                    <td className="px-4 py-2">{s.tx_count}</td>
                    <td className="px-4 py-2 text-[var(--foreground)]/60">
                      {new Date(s.period_start).toLocaleDateString()} –{" "}
                      {new Date(s.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                  {expandedId === s.id && source === "live" && (
                    <tr className="border-t border-[var(--border)] bg-[var(--surface)]">
                      <td className="px-4 py-3" colSpan={6}>
                        <SettlementStatusForm settlement={s} onUpdated={handleStatusUpdated} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
