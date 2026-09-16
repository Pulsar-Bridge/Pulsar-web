"use client";

// Wallet connection via @creit.tech/stellar-wallets-kit. Supports Freighter
// and xBull as documented in the README. Never touches a private key or
// seed phrase directly — every signature goes through the wallet extension's
// own popup/signing flow.

import {
  FreighterModule,
  StellarWalletsKit,
  WalletNetwork,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";

function resolveNetwork(): WalletNetwork {
  const passphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE;
  if (passphrase === "Public Global Stellar Network ; September 2015") {
    return WalletNetwork.PUBLIC;
  }
  return WalletNetwork.TESTNET;
}

let kitInstance: StellarWalletsKit | null = null;

/** Lazily constructs a singleton kit instance (client-side only). */
export function getWalletKit(): StellarWalletsKit {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      network: resolveNetwork(),
      selectedWalletId: FreighterModule.id,
      modules: [new FreighterModule(), new xBullModule()],
    });
  }
  return kitInstance;
}

export interface ConnectedWallet {
  address: string;
  walletId: string;
}

/** Opens the wallet-selection modal and resolves once the user has picked one. */
export function connectWallet(): Promise<ConnectedWallet> {
  const kit = getWalletKit();
  return new Promise((resolve, reject) => {
    kit
      .openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            resolve({ address, walletId: option.id });
          } catch (err) {
            reject(err);
          }
        },
        onClosed: (err) => {
          if (err) reject(err);
        },
      })
      .catch(reject);
  });
}

/** Signs an XDR transaction envelope with the currently selected wallet. */
export async function signTransactionXdr(
  xdr: string,
  address: string,
  networkPassphrase: string,
): Promise<string> {
  const kit = getWalletKit();
  const { signedTxXdr } = await kit.signTransaction(xdr, { address, networkPassphrase });
  return signedTxXdr;
}
