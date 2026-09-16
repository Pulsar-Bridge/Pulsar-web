import { describe, expect, it } from "vitest";
import { ABI_ENDPOINTS, RELAY_ENDPOINTS } from "../constants";

describe("ABI_ENDPOINTS", () => {
  it("has no duplicate entry-point names", () => {
    const names = ABI_ENDPOINTS.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every entry has a non-empty signature and description", () => {
    for (const endpoint of ABI_ENDPOINTS) {
      expect(endpoint.signature.length).toBeGreaterThan(0);
      expect(endpoint.description.length).toBeGreaterThan(0);
    }
  });

  it("includes the read-only admin/relay_signer getters", () => {
    const names = ABI_ENDPOINTS.map((e) => e.name);
    expect(names).toContain("admin");
    expect(names).toContain("relay_signer");
  });
});

describe("RELAY_ENDPOINTS", () => {
  it("has no duplicate paths", () => {
    const paths = RELAY_ENDPOINTS.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
