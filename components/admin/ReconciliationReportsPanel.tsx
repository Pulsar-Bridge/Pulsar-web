"use client";

import { useEffect, useState } from "react";
import {
  getReconciliationReport,
  listReconciliationReports,
  RelayApiError,
} from "../../lib/api/relay-client";
import { MOCK_RECONCILIATION_REPORTS } from "../../lib/mock-data";
import type { RelayReconciliationReportDetail, RelayReconciliationReportSummary } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function ReconciliationReportsPanel() {
  const [reports, setReports] = useState<RelayReconciliationReportSummary[]>(MOCK_RECONCILIATION_REPORTS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<RelayReconciliationReportDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    listReconciliationReports({ limit: 10 })
      .then((res) => {
        setReports(res.reports);
        setSource("live");
      })
      .catch((err: unknown) => {
        setReports(MOCK_RECONCILIATION_REPORTS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
  }, []);

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setReportDetail(null);
      return;
    }
    setExpandedId(id);
    setReportDetail(null);
    setDetailError(null);
    if (source !== "live") return;
    getReconciliationReport(id)
      .then(setReportDetail)
      .catch((err: unknown) => setDetailError(err instanceof Error ? err.message : "Failed to load report"));
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Reconciliation reports</h3>
      <DataSourceBanner source={source} detail={detail} />
      <ul className="space-y-2 text-xs">
        {reports.map((r) => (
          <li key={r.id} className="rounded border border-[var(--border)] bg-[var(--background)] p-2">
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() => toggleExpand(r.id)}
            >
              <span className="text-[var(--foreground)]/60">
                {new Date(r.period_start).toLocaleDateString()} –{" "}
                {new Date(r.period_end).toLocaleDateString()}
              </span>
              <span className={r.has_discrepancies ? "text-[var(--danger)]" : "text-[var(--success)]"}>
                {r.has_discrepancies ? "Discrepancies found" : "Clean"}
              </span>
            </button>
            <p className="mt-1 text-[var(--foreground)]/50">
              {r.total_db_transactions} DB txs vs {r.total_chain_payments} chain payments ·{" "}
              {r.missing_on_chain_count} missing · {r.orphaned_payments_count} orphaned ·{" "}
              {r.amount_mismatches_count} amount mismatches
            </p>
            {expandedId === r.id && (
              <div className="mt-2 border-t border-[var(--border)] pt-2">
                {source !== "live" && (
                  <p className="text-[var(--foreground)]/40">Detail drill-down requires live relay data.</p>
                )}
                {detailError && <p className="text-[var(--danger)]">{detailError}</p>}
                {source === "live" && !reportDetail && !detailError && (
                  <p className="text-[var(--foreground)]/50">Loading…</p>
                )}
                {reportDetail && (
                  <div className="space-y-2">
                    {reportDetail.missing_on_chain.length > 0 && (
                      <ReportSection title="Missing on-chain">
                        {reportDetail.missing_on_chain.map((m) => (
                          <li key={m.id}>
                            {m.stellar_account.slice(0, 6)}… {m.amount} {m.asset_code}
                          </li>
                        ))}
                      </ReportSection>
                    )}
                    {reportDetail.orphaned_payments.length > 0 && (
                      <ReportSection title="Orphaned on-chain payments">
                        {reportDetail.orphaned_payments.map((p) => (
                          <li key={p.payment_id}>
                            {p.payment_id.slice(0, 8)}… {p.amount} {p.asset_code}
                          </li>
                        ))}
                      </ReportSection>
                    )}
                    {reportDetail.amount_mismatches.length > 0 && (
                      <ReportSection title="Amount mismatches">
                        {reportDetail.amount_mismatches.map((m) => (
                          <li key={m.transaction_id}>
                            db {m.db_amount} vs chain {m.chain_amount}
                          </li>
                        ))}
                      </ReportSection>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      <ul className="mt-1 space-y-0.5 font-mono text-[var(--foreground)]/60">{children}</ul>
    </div>
  );
}
