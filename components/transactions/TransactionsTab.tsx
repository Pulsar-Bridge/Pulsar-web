"use client";

import { useEffect, useState } from "react";
import { listTransactions, RelayApiError } from "../../lib/api/relay-client";
import { MOCK_TXS } from "../../lib/mock-data";
import type { RelayTransaction } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";
import { StatusBadge } from "../ui/StatusBadge";
import { TransactionDetail } from "./detail/TransactionDetail";

export function TransactionsTab() {
  const [txs, setTxs] = useState<RelayTransaction[]>(MOCK_TXS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTransactions({ limit: 25 })
      .then((res) => {
        if (cancelled) return;
        setTxs(res.data);
        setSource("live");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTxs(MOCK_TXS);
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
              <th className="px-4 py-2">Account</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Asset</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && txs.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--foreground)]/50" colSpan={6}>
                  Loading transactions…
                </td>
              </tr>
            ) : (
              txs.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedId(tx.id)}
                  className="cursor-pointer border-t border-[var(--border)] hover:bg-[var(--surface)]"
                >
                  <td className="px-4 py-2 font-mono text-xs">{tx.id.slice(0, 8)}…</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {tx.stellar_account.slice(0, 6)}…{tx.stellar_account.slice(-4)}
                  </td>
                  <td className="px-4 py-2">{tx.amount}</td>
                  <td className="px-4 py-2">{tx.asset_code}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-2 text-[var(--foreground)]/60">
                    {new Date(tx.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedId && <TransactionDetail txId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
