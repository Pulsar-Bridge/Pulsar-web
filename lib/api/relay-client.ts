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
  RelayDailyTotal,
  RelayErrorBody,
  RelaySettlement,
  RelaySettlementListResponse,
  RelayStatusCount,
  RelayTransaction,
  RelayTransactionListResponse,
  RelayWebhookEndpointHealth,
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
