// Shared types mirroring pulsar-core's DB models (src/db/models.rs) and
// pulsar-core-contracts' on-chain types (src/types.rs). Keep these in sync
// with the sibling repos when either changes shape.

export type RelayTransactionStatus = "pending" | "processing" | "completed" | "failed";

/** Mirrors pulsar-core's `db::models::Transaction` JSON shape. */
export interface RelayTransaction {
  id: string;
  stellar_account: string;
  amount: string;
  asset_code: string;
  status: RelayTransactionStatus;
  created_at: string;
  updated_at: string;
  anchor_transaction_id: string | null;
  callback_type: string | null;
  callback_status: string | null;
  settlement_id: string | null;
  memo: string | null;
  memo_type: string | null;
  metadata: Record<string, unknown> | null;
  trace_id: string | null;
}

export interface RelayTransactionListMeta {
  next_cursor: string | null;
  has_more: boolean;
}

export interface RelayTransactionListResponse {
  data: RelayTransaction[];
  meta: RelayTransactionListMeta;
}

/** Mirrors pulsar-core's `db::models::Settlement`. */
export interface RelaySettlement {
  id: string;
  asset_code: string;
  total_amount: string;
  tx_count: number;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  updated_at: string;
  dispute_reason: string | null;
  original_total_amount: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface RelaySettlementListResponse {
  settlements: RelaySettlement[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface RelayStatusCount {
  status: string;
  count: number;
}

export interface RelayDailyTotal {
  date: string;
  total_amount: string;
  tx_count: number;
}

export interface RelayAssetStats {
  asset_code: string;
  total_amount: string;
  tx_count: number;
  avg_amount: string;
}

/** Mirrors pulsar-core's `db::queries::AuditLogRow`. */
export interface RelayAuditLogRow {
  id: string;
  entity_id: string;
  entity_type: string;
  action: string;
  old_val: Record<string, unknown> | null;
  new_val: Record<string, unknown> | null;
  actor: string;
  timestamp: string;
}

export interface RelayAuditSearchResponse {
  total: number;
  data: RelayAuditLogRow[];
  next_cursor: string | null;
}

/** Mirrors pulsar-core's `services::webhook_dispatcher::EndpointHealth`. */
export interface RelayWebhookEndpointHealth {
  id: string;
  url: string;
  enabled: boolean;
  success_rate: number;
  total_deliveries: number;
  last_success_at: string | null;
}

/** Mirrors pulsar-core's `middleware::quota::QuotaStatus`. */
export interface RelayQuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  reset_in_seconds: number;
}

/** Mirrors pulsar-core's `handlers::admin::quota::TenantQuotaView`. */
export interface RelayTenantQuota {
  tenant_id: string;
  name: string;
  rate_limit_per_minute: number;
  quota_status: RelayQuotaStatus | null;
}

/** Mirrors pulsar-core's `services::lock_manager::ActiveLockInfo`. */
export interface RelayActiveLock {
  resource: string;
  token: string;
  /** Unix timestamp in seconds. */
  acquired_at: number;
  ttl_secs: number;
  expected_duration_secs: number;
  overdue: boolean;
}

export interface RelayLocksResponse {
  active_locks: RelayActiveLock[];
  total: number;
  overdue: number;
}

/** Mirrors pulsar-core's `error::AppError` JSON error body. */
export interface RelayErrorBody {
  error: string;
  code: string;
  status: number;
  timestamp: string;
  detail: string;
  docs_url: string;
}

// ─── On-chain contract types (synapse-core-contract src/types.rs) ──────────

export type OnChainTransactionStatus = "Pending" | "Processing" | "Completed" | "Failed";

export interface OnChainTransaction {
  id: string;
  stellar_account: string;
  amount: bigint;
  asset_code: string;
  asset_issuer: string;
  status: OnChainTransactionStatus;
  created_at_ledger: number;
  updated_at_ledger: number;
  anchor_transaction_id: string;
  callback_type: "Deposit" | "Withdrawal";
  callback_status: string;
  stellar_tx_hash: string;
  failure_reason: string;
}

export interface ContractInfo {
  admin: string;
  relaySigner: string;
  isPaused: boolean;
  isInitialised: boolean;
  schemaVersion: number;
  version: string;
}
