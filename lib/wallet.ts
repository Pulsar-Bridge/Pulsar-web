"use client";

// Wallet connection via @creit.tech/stellar-wallets-kit (v2's static-class
// API — StellarWalletsKit.init/authModal/signTransaction, not the v1
// instance-based `new StellarWalletsKit().openModal()` API). Supports
// Freighter and xBull as documented in the README. Never touches a private
// key or seed phrase directly — every signature goes through the wallet
// extension's own popup/signing flow.

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";

function resolveNetwork(): Networks {
  const passphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE;
  return passphrase === Networks.PUBLIC ? Networks.PUBLIC : Networks.TESTNET;
}

let initialised = false;

function ensureInit(): void {
  if (initialised) return;
  StellarWalletsKit.init({
    modules: [new FreighterModule(), new xBullModule()],
    network: resolveNetwork(),
  });
  initialised = true;
}

export interface ConnectedWallet {
  address: string;
}

/** Opens the kit's wallet-selection modal and resolves once the user has picked one. */
export async function connectWallet(): Promise<ConnectedWallet> {
  ensureInit();
  const { address } = await StellarWalletsKit.authModal();
  return { address };
}

/** Signs an XDR transaction envelope with the currently selected wallet. */
export async function signTransactionXdr(
  xdr: string,
  address: string,
  networkPassphrase: string,
): Promise<string> {
  ensureInit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, { address, networkPassphrase });
  return signedTxXdr;
}
