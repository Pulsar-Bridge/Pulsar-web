import { StrKey } from "@stellar/stellar-sdk";

/** True for a well-formed Stellar Ed25519 public key (G... address), checksum included. */
export function isValidStellarAddress(value: string): boolean {
  return StrKey.isValidEd25519PublicKey(value.trim());
}
