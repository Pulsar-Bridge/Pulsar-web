"use client";

import { useEffect, useState } from "react";
import {
  clearWebhookFilterRules,
  listWebhookFilterRules,
  RelayApiError,
  setWebhookFilterRules,
} from "../../lib/api/relay-client";
import { MOCK_WEBHOOK_FILTER_RULES } from "../../lib/mock-data";
import type { RelayWebhookFilterRules, RelayWebhookFilterRulesResponse } from "../../lib/types";
import { DataSourceBanner, type DataSource } from "../ui/DataSourceBanner";

export function WebhookFilterRulesPanel() {
  const [rules, setRules] = useState<RelayWebhookFilterRulesResponse[]>(MOCK_WEBHOOK_FILTER_RULES);
  const [source, setSource] = useState<DataSource>("mock");
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [endpointId, setEndpointId] = useState("");
  const [rulesJson, setRulesJson] = useState("{}");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    listWebhookFilterRules()
      .then((res) => {
        setRules(res);
        setSource("live");
      })
      .catch((err: unknown) => {
        setRules(MOCK_WEBHOOK_FILTER_RULES);
        setSource(err instanceof RelayApiError && err.status === 503 ? "mock" : "error");
        setDetail(err instanceof Error ? err.message : undefined);
      });
  }

  useEffect(load, []);

  async function handleSave() {
    if (!endpointId.trim()) return;
    setFormError(null);
    let parsed: RelayWebhookFilterRules;
    try {
      parsed = JSON.parse(rulesJson) as RelayWebhookFilterRules;
    } catch {
      setFormError("Filter rules must be valid JSON.");
      return;
    }
    setBusy(true);
    try {
      await setWebhookFilterRules(endpointId.trim(), parsed);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save filter rules");
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!endpointId.trim()) return;
    setBusy(true);
    setFormError(null);
    try {
      await clearWebhookFilterRules(endpointId.trim());
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to clear filter rules");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-2 text-sm font-medium text-[var(--foreground)]/70">Webhook filter rules</h3>
      <p className="mb-3 text-xs text-[var(--foreground)]/50">
        Fail-open: an endpoint with no rules (or a rule the dispatcher can&apos;t evaluate) receives every
        event it&apos;s subscribed to.
      </p>
      <DataSourceBanner source={source} detail={detail} />

      {rules.length === 0 && (
        <p className="text-xs text-[var(--foreground)]/50">No endpoints have filter rules set.</p>
      )}
      <ul className="space-y-2 text-xs">
        {rules.map((r) => (
          <li
            key={r.endpoint_id}
            className="rounded border border-[var(--border)] bg-[var(--background)] p-2"
          >
            <div className="flex justify-between text-[var(--foreground)]/60">
              <span className="font-mono">{r.endpoint_id}</span>
              <span>{new Date(r.updated_at).toLocaleString()}</span>
            </div>
            <pre className="mt-1 overflow-x-auto text-[10px] text-[var(--foreground)]/70">
              {JSON.stringify(r.filter_rules, null, 2)}
            </pre>
          </li>
        ))}
      </ul>

      {source === "live" && (
        <div className="mt-3 space-y-2 text-xs">
          <input
            value={endpointId}
            onChange={(e) => setEndpointId(e.target.value)}
            placeholder="Webhook endpoint ID"
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 font-mono"
          />
          <textarea
            value={rulesJson}
            onChange={(e) => setRulesJson(e.target.value)}
            rows={3}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 font-mono"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || !endpointId.trim()}
              onClick={handleSave}
              className="rounded border border-[var(--border)] px-3 py-1 font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--background)]"
            >
              {busy ? "Saving…" : "Save rules"}
            </button>
            <button
              disabled={busy || !endpointId.trim()}
              onClick={handleClear}
              className="rounded border border-[var(--border)] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--background)]"
            >
              Clear rules
            </button>
          </div>
          {formError && <p className="text-[var(--danger)]">{formError}</p>}
        </div>
      )}
    </div>
  );
}
