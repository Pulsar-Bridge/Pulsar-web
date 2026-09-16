// Fallback data used when no wallet is connected, NEXT_PUBLIC_CONTRACT_ID is
// unset, or the relay API is unreachable. Shapes match RelayTransaction /
// RelaySettlement / ContractInfo exactly so tab components never need to
// branch on "mock vs live" beyond deciding which source to call.
//
// This is intentional scaffolding, not a shortcut: keep it in sync with
// lib/types.ts, and shrink what depends on it as real endpoints ship
// (mock-to-live ratchet — see README roadmap).

import type {
  ContractInfo,
  RelayAssetStats,
  RelayDailyTotal,
  RelaySettlement,
  RelayStatusCount,
  RelayTransaction,
} from "./types";

export const MOCK_TXS: RelayTransaction[] = [
  {
    id: "b3f1c2a0-1e9d-4b3a-9c1a-6f2d0a1e2b3c",
    stellar_account: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWX",
    amount: "250.00",
    asset_code: "USDC",
    status: "completed",
    created_at: "2026-09-14T08:12:00Z",
    updated_at: "2026-09-14T08:14:32Z",
    anchor_transaction_id: "anchor-9f21",
    callback_type: "deposit",
    callback_status: "completed",
    settlement_id: "d4a2b1c0-3f5e-4a6b-8c7d-1e2f3a4b5c6d",
    memo: null,
    memo_type: null,
    metadata: null,
    trace_id: null,
  },
  {
    id: "a1e2d3c4-5b6a-4f8e-9d0c-1a2b3c4d5e6f",
    stellar_account: "GZYXWVUTSRQPONMLKJIHGFEDCBA765432ZYXWVUTSRQPONMLKJIHGFED",
    amount: "1000.00",
    asset_code: "USD",
    status: "processing",
    created_at: "2026-09-15T14:02:11Z",
    updated_at: "2026-09-15T14:03:00Z",
    anchor_transaction_id: "anchor-7a4c",
    callback_type: "deposit",
    callback_status: "pending_external",
    settlement_id: null,
    memo: null,
    memo_type: null,
    metadata: null,
    trace_id: null,
  },
  {
    id: "c5d6e7f8-9a0b-4c1d-8e2f-3a4b5c6d7e8f",
    stellar_account: "GMNBVCXZASDFGHJKLQWERTYUIOP123456MNBVCXZASDFGHJKLQWERTY",
    amount: "75.50",
    asset_code: "USDC",
    status: "failed",
    created_at: "2026-09-13T22:40:05Z",
    updated_at: "2026-09-13T22:41:19Z",
    anchor_transaction_id: "anchor-1b3d",
    callback_type: "withdrawal",
    callback_status: "error",
    settlement_id: null,
    memo: null,
    memo_type: null,
    metadata: null,
    trace_id: null,
  },
  {
    id: "e9f0a1b2-3c4d-4e5f-9a0b-1c2d3e4f5a6b",
    stellar_account: "GQAZWSXEDCRFVTGBYHNUJMIKOLP098765QAZWSXEDCRFVTGBYHNUJMI",
    amount: "500.00",
    asset_code: "USDC",
    status: "pending",
    created_at: "2026-09-16T07:55:44Z",
    updated_at: "2026-09-16T07:55:44Z",
    anchor_transaction_id: "anchor-5e6f",
    callback_type: "deposit",
    callback_status: "pending_external",
    settlement_id: null,
    memo: null,
    memo_type: null,
    metadata: null,
    trace_id: null,
  },
];

export const MOCK_SETTLEMENTS: RelaySettlement[] = [
  {
    id: "d4a2b1c0-3f5e-4a6b-8c7d-1e2f3a4b5c6d",
    asset_code: "USDC",
    total_amount: "12500.00",
    tx_count: 34,
    period_start: "2026-09-13T00:00:00Z",
    period_end: "2026-09-14T00:00:00Z",
    status: "settled",
    created_at: "2026-09-14T09:00:00Z",
    updated_at: "2026-09-14T09:00:00Z",
    dispute_reason: null,
    original_total_amount: null,
    reviewed_by: null,
    reviewed_at: null,
  },
];

export const MOCK_STATUS_COUNTS: RelayStatusCount[] = [
  { status: "pending", count: 12 },
  { status: "processing", count: 4 },
  { status: "completed", count: 187 },
  { status: "failed", count: 3 },
];

export const MOCK_DAILY_TOTALS: RelayDailyTotal[] = [
  { date: "2026-09-10", total_amount: "4200.00", tx_count: 18 },
  { date: "2026-09-11", total_amount: "3875.50", tx_count: 15 },
  { date: "2026-09-12", total_amount: "5120.00", tx_count: 22 },
  { date: "2026-09-13", total_amount: "6003.25", tx_count: 27 },
  { date: "2026-09-14", total_amount: "4590.00", tx_count: 19 },
  { date: "2026-09-15", total_amount: "5210.75", tx_count: 21 },
  { date: "2026-09-16", total_amount: "1980.00", tx_count: 8 },
];

export const MOCK_ASSET_STATS: RelayAssetStats[] = [
  { asset_code: "USDC", total_amount: "28500.00", tx_count: 142, avg_amount: "200.70" },
  { asset_code: "USD", total_amount: "3480.50", tx_count: 6, avg_amount: "580.08" },
];

export const MOCK_CONTRACT_INFO: ContractInfo = {
  admin: "GADMIN00000000000000000000000000000000000000000000000000",
  relaySigner: "GRELAY0000000000000000000000000000000000000000000000000",
  isPaused: false,
  isInitialised: true,
  schemaVersion: 1,
  version: "0.1.0",
};
