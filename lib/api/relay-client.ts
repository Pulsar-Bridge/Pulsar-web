"use client";

// Client-side relay API. Calls this app's own /api/relay/* route handlers
// (never the pulsar-core relay directly) so the tenant/admin API keys stay
// server-side. Every function throws RelayApiError on any non-2xx response
// or network failure instead of silently returning undefined — callers are
// responsible for deciding whether to fall back to mock data and for
// surfacing that fallback to the user (see security checklist item 3).

import type {
  RelayAssetStats,
  RelayAuditSearchResponse,
  RelayCombinedCacheMetrics,
  RelayComplianceReport,
  RelayDailyTotal,
  RelayErrorBody,
  RelayLocksResponse,
  RelaySettlement,
  RelaySettlementListResponse,
  RelayStatusCount,
  RelayTenantQuota,
  RelayTransaction,
  RelayTransactionListResponse,
  RelayWebhookEndpointHealth,
  RelayWebhookFilterRules,
  RelayWebhookFilterRulesResponse,
} from "../types";

export class RelayApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Partial<RelayErrorBody> | null,
  ) {
    super(body?.error ?? `Relay API request failed with status ${status}`);
    this.name = "RelayApiError";
  }
}

async function getJson<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (err) {
    throw new RelayApiError(0, { error: err instanceof Error ? err.message : "network error" });
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new RelayApiError(response.status, body);
  }
  return body as T;
}

async function mutateJson<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (err) {
    throw new RelayApiError(0, { error: err instanceof Error ? err.message : "network error" });
  }

  const responseBody = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new RelayApiError(response.status, responseBody);
  }
  return responseBody as T;
}

export function listTransactions(params?: {
  cursor?: string;
  limit?: number;
  direction?: "forward" | "backward";
  from_date?: string;
  to_date?: string;
}): Promise<RelayTransactionListResponse> {
  return getJson("/api/relay/transactions", {
    cursor: params?.cursor,
    limit: params?.limit?.toString(),
    direction: params?.direction,
    from_date: params?.from_date,
    to_date: params?.to_date,
  });
}

export function getTransaction(id: string): Promise<RelayTransaction> {
  return getJson(`/api/relay/transactions/${encodeURIComponent(id)}`);
}

export function listSettlements(params?: {
  cursor?: string;
  limit?: number;
  direction?: "forward" | "backward";
}): Promise<RelaySettlementListResponse> {
  return getJson("/api/relay/settlements", {
    cursor: params?.cursor,
    limit: params?.limit?.toString(),
    direction: params?.direction,
  });
}

export function getSettlement(id: string): Promise<RelaySettlement> {
  return getJson(`/api/relay/settlements/${encodeURIComponent(id)}`);
}

export function getStatusCounts(): Promise<RelayStatusCount[]> {
  return getJson("/api/relay/stats/status");
}

export function getDailyTotals(days = 7): Promise<RelayDailyTotal[]> {
  return getJson("/api/relay/stats/daily", { days: days.toString() });
}

export function getAssetStats(): Promise<RelayAssetStats[]> {
  return getJson("/api/relay/stats/assets");
}

export function searchAuditLogs(params?: {
  actor?: string;
  action?: string;
  entity_type?: string;
  cursor?: string;
  limit?: number;
}): Promise<RelayAuditSearchResponse> {
  return getJson("/api/relay/admin/audit/search", {
    actor: params?.actor,
    action: params?.action,
    entity_type: params?.entity_type,
    cursor: params?.cursor,
    limit: params?.limit?.toString(),
  });
}

export function listWebhookHealth(): Promise<RelayWebhookEndpointHealth[]> {
  return getJson("/api/relay/admin/webhooks/health");
}

export function listTenantQuotas(): Promise<RelayTenantQuota[]> {
  return getJson("/api/relay/admin/quotas");
}

export function setTenantQuota(tenantId: string, customLimit: number): Promise<unknown> {
  return mutateJson("PUT", `/api/relay/admin/quotas/${encodeURIComponent(tenantId)}`, {
    custom_limit: customLimit,
  });
}

export function resetTenantQuota(tenantId: string): Promise<unknown> {
  return mutateJson("DELETE", `/api/relay/admin/quotas/${encodeURIComponent(tenantId)}/reset`);
}

export function listActiveLocks(): Promise<RelayLocksResponse> {
  return getJson("/api/relay/admin/locks");
}

export function forceReleaseLock(resource: string): Promise<unknown> {
  return mutateJson("POST", `/api/relay/admin/locks/${encodeURIComponent(resource)}/force-release`);
}

export function listComplianceReports(params?: {
  period?: string;
  limit?: number;
  offset?: number;
}): Promise<RelayComplianceReport[]> {
  return getJson("/api/relay/admin/compliance/reports", {
    period: params?.period,
    limit: params?.limit?.toString(),
    offset: params?.offset?.toString(),
  });
}

export function generateComplianceReport(period: string): Promise<RelayComplianceReport> {
  return mutateJson("POST", `/api/relay/admin/compliance/reports?period=${encodeURIComponent(period)}`);
}

export function getCacheMetrics(): Promise<RelayCombinedCacheMetrics> {
  return getJson("/api/relay/cache/metrics");
}

export function listWebhookFilterRules(): Promise<RelayWebhookFilterRulesResponse[]> {
  return getJson("/api/relay/admin/webhooks/filter-rules");
}

export function setWebhookFilterRules(
  endpointId: string,
  filterRules: RelayWebhookFilterRules | null,
): Promise<RelayWebhookFilterRulesResponse> {
  return mutateJson(
    "PUT",
    `/api/relay/admin/webhooks/endpoints/${encodeURIComponent(endpointId)}/filter-rules`,
    {
      filter_rules: filterRules,
    },
  );
}

export function clearWebhookFilterRules(endpointId: string): Promise<unknown> {
  return mutateJson(
    "DELETE",
    `/api/relay/admin/webhooks/endpoints/${encodeURIComponent(endpointId)}/filter-rules`,
  );
}
