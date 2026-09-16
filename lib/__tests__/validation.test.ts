import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { isValidStellarAddress } from "../validation";

describe("isValidStellarAddress", () => {
  it("accepts a freshly generated valid public key", () => {
    const address = Keypair.random().publicKey();
    expect(isValidStellarAddress(address)).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidStellarAddress("")).toBe(false);
  });

  it("rejects a plausible-looking but checksum-invalid address", () => {
    const valid = Keypair.random().publicKey();
    const corrupted = "G" + valid.slice(1, -1) + (valid.at(-1) === "A" ? "B" : "A");
    expect(isValidStellarAddress(corrupted)).toBe(false);
  });

  it("rejects a secret seed (S...) passed where a public key is expected", () => {
    const secret = Keypair.random().secret();
    expect(isValidStellarAddress(secret)).toBe(false);
  });

  it("tolerates surrounding whitespace", () => {
    const address = Keypair.random().publicKey();
    expect(isValidStellarAddress(`  ${address}  `)).toBe(true);
  });
});
