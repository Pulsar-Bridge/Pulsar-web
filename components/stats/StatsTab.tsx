"use client";

import { useEffect, useState } from "react";
import { getAssetStats, getDailyTotals, getStatusCounts, RelayApiError } from "../../lib/api/relay-client";
import { MOCK_ASSET_STATS, MOCK_DAILY_TOTALS, MOCK_STATUS_COUNTS } from "../../lib/mock-data";
import type { RelayAssetStats, RelayDailyTotal, RelayStatusCount } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function StatsTab() {
  const [statusCounts, setStatusCounts] = useState<RelayStatusCount[]>(MOCK_STATUS_COUNTS);
  const [dailyTotals, setDailyTotals] = useState<RelayDailyTotal[]>(MOCK_DAILY_TOTALS);
  const [assetStats, setAssetStats] = useState<RelayAssetStats[]>(MOCK_ASSET_STATS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStatusCounts(), getDailyTotals(7), getAssetStats()])
      .then(([statuses, daily, assets]) => {
        if (cancelled) return;
        setStatusCounts(statuses);
        setDailyTotals(daily);
        setAssetStats(assets);
        setSource("live");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatusCounts(MOCK_STATUS_COUNTS);
        setDailyTotals(MOCK_DAILY_TOTALS);
        setAssetStats(MOCK_ASSET_STATS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxDaily = Math.max(...dailyTotals.map((d) => Number(d.total_amount)), 1);

  return (
    <div className="space-y-6">
      <DataSourceBanner source={source} detail={detail} />

      <section>
        <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Status breakdown</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statusCounts.map((s) => (
            <div key={s.status} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs uppercase text-[var(--foreground)]/50">{s.status}</p>
              <p className="mt-1 text-2xl font-semibold">{s.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Daily volume (last 7 days)</h3>
        <div className="flex items-end gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          {dailyTotals.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[var(--accent)]"
                style={{ height: `${Math.max((Number(d.total_amount) / maxDaily) * 96, 4)}px` }}
                title={`${d.total_amount} (${d.tx_count} txs)`}
              />
              <span className="text-[10px] text-[var(--foreground)]/50">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Per-asset totals</h3>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--foreground)]/60">
              <tr>
                <th className="px-4 py-2">Asset</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Tx Count</th>
                <th className="px-4 py-2">Average</th>
              </tr>
            </thead>
            <tbody>
              {assetStats.map((a) => (
                <tr key={a.asset_code} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2">{a.asset_code}</td>
                  <td className="px-4 py-2">{a.total_amount}</td>
                  <td className="px-4 py-2">{a.tx_count}</td>
                  <td className="px-4 py-2">{a.avg_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
