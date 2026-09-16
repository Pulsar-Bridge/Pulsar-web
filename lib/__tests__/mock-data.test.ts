import { describe, expect, it } from "vitest";
import { MOCK_ASSET_STATS, MOCK_DAILY_TOTALS, MOCK_SETTLEMENTS, MOCK_STATUS_COUNTS, MOCK_TXS } from "../mock-data";

describe("mock data", () => {
  it("every mock transaction has a status one of the four lifecycle states", () => {
    const valid = new Set(["pending", "processing", "completed", "failed"]);
    for (const tx of MOCK_TXS) {
      expect(valid.has(tx.status)).toBe(true);
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
});
