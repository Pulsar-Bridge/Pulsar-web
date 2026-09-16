import { describe, expect, it } from "vitest";
import {
  MOCK_ASSET_STATS,
  MOCK_CONTRACT_INFO,
  MOCK_DAILY_TOTALS,
  MOCK_SETTLEMENTS,
  MOCK_STATUS_COUNTS,
  MOCK_TXS,
  MOCK_WEBHOOK_HEALTH,
} from "../mock-data";

describe("mock data", () => {
  it("every mock Stellar address is 56 characters, matching a real G-address", () => {
    const addresses = [
      ...MOCK_TXS.map((tx) => tx.stellar_account),
      MOCK_CONTRACT_INFO.admin,
      MOCK_CONTRACT_INFO.relaySigner,
    ];
    for (const address of addresses) {
      expect(address).toHaveLength(56);
    }
  });

  it("every mock transaction has a status one of the four lifecycle states", () => {
    const valid = new Set(["pending", "processing", "completed", "failed"]);
    for (const tx of MOCK_TXS) {
      expect(valid.has(tx.status)).toBe(true);
    }
  });

  it("every mock settlement has a status pulsar-core's dispute workflow actually produces", () => {
    // Settlements start at "completed" (services::settlement.rs) and only ever
    // move through the dispute-workflow states — "settled" isn't one of them.
    const valid = new Set(["completed", "pending_review", "disputed", "voided", "adjusted"]);
    for (const settlement of MOCK_SETTLEMENTS) {
      expect(valid.has(settlement.status)).toBe(true);
    }
  });

  it("settlements referenced by a completed transaction exist in MOCK_SETTLEMENTS", () => {
    const settlementIds = new Set(MOCK_SETTLEMENTS.map((s) => s.id));
    for (const tx of MOCK_TXS) {
      if (tx.settlement_id) {
        expect(settlementIds.has(tx.settlement_id)).toBe(true);
      }
    }
  });

  it("status counts sum to a positive total", () => {
    const total = MOCK_STATUS_COUNTS.reduce((sum, s) => sum + s.count, 0);
    expect(total).toBeGreaterThan(0);
  });

  it("daily totals and asset stats are non-empty", () => {
    expect(MOCK_DAILY_TOTALS.length).toBeGreaterThan(0);
    expect(MOCK_ASSET_STATS.length).toBeGreaterThan(0);
  });

  it("webhook health success_rate is a 0-100 percentage, matching pulsar-core's NUMERIC(5,2) column", () => {
    for (const endpoint of MOCK_WEBHOOK_HEALTH) {
      expect(endpoint.success_rate).toBeGreaterThanOrEqual(0);
      expect(endpoint.success_rate).toBeLessThanOrEqual(100);
    }
  });
});
