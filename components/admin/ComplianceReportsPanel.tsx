"use client";

import { useEffect, useState } from "react";
import { generateComplianceReport, listComplianceReports, RelayApiError } from "../../lib/api/relay-client";
import { MOCK_COMPLIANCE_REPORTS } from "../../lib/mock-data";
import type { RelayComplianceReport } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function ComplianceReportsPanel() {
  const [reports, setReports] = useState<RelayComplianceReport[]>(MOCK_COMPLIANCE_REPORTS);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState("");
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    listComplianceReports({ limit: 10 })
      .then((res) => {
        setReports(res);
        setSource("live");
      })
      .catch((err: unknown) => {
        setReports(MOCK_COMPLIANCE_REPORTS);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
  }

  useEffect(load, []);

  async function handleGenerate() {
    if (!period.trim()) return;
    setGenerating(true);
    setActionError(null);
    try {
      await generateComplianceReport(period.trim());
      setPeriod("");
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Compliance reports</h3>
      <DataSourceBanner source={source} detail={detail} />

      {source === "live" && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Period, e.g. 2026-09"
            className="w-40 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 font-mono"
          />
          <button
            disabled={generating || !period.trim()}
            onClick={handleGenerate}
            className="rounded border border-[var(--border)] px-3 py-1 font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--background)]"
          >
            {generating ? "Generating…" : "Generate report"}
          </button>
        </div>
      )}

      <ul className="space-y-2 text-xs">
        {reports.map((r) => (
          <li key={r.id} className="rounded border border-[var(--border)] bg-[var(--background)] p-2">
            <div className="flex justify-between text-[var(--foreground)]/60">
              <span className="font-medium text-[var(--foreground)]">{r.period}</span>
              <span>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-[var(--foreground)]/50">
              {r.transaction_count} txs · {r.settlement_total} settled ·{" "}
              {r.anomaly_count > 0 ? (
                <span className="text-[var(--warning)]">{r.anomaly_count} anomalies</span>
              ) : (
                "no anomalies"
              )}
            </p>
          </li>
        ))}
      </ul>
      {actionError && <p className="mt-2 text-xs text-[var(--danger)]">{actionError}</p>}
    </div>
  );
}
