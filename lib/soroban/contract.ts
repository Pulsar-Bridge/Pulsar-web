// Soroban contract invoke/simulate encoding layer for the SynapseCoreContract
// (see ../../pulsar-core-contracts/src/lib.rs for the authoritative ABI).
//
// This module is the stable extension point mentioned in the project brief:
// add new read/write wrappers here as the contract grows, but keep
// `simulateRead` / `submitInvocation` themselves as the single place that
// knows how to talk to Soroban RPC.

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc as SorobanRpc,
} from "@stellar/stellar-sdk";
import type { ContractInfo, OnChainTransaction } from "../types";
import { signTransactionXdr } from "../wallet";

export class ContractNotConfiguredError extends Error {
  constructor() {
    super("NEXT_PUBLIC_CONTRACT_ID is not set — falling back to mock data.");
    this.name = "ContractNotConfiguredError";
  }
}

export class ContractCallError extends Error {
  constructor(
    public readonly method: string,
    cause: string,
  ) {
    super(`Soroban call to "${method}" failed: ${cause}`);
    this.name = "ContractCallError";
  }
}

interface SorobanEnv {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
}

function getSorobanEnv(): SorobanEnv {
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;
  if (!contractId) {
    throw new ContractNotConfiguredError();
  }
  const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
  const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET;
  return { contractId, rpcUrl, networkPassphrase };
}

/** True when the contract is configured, without throwing. Used by tabs to decide mock-vs-live. */
export function isContractConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CONTRACT_ID);
}

async function simulateRead<T>(method: string, args: xdr.ScVal[] = []): Promise<T> {
  const { contractId, rpcUrl, networkPassphrase } = getSorobanEnv();
  const server = new SorobanRpc.Server(rpcUrl);
  const contract = new Contract(contractId);

  // Read-only simulation never submits to the ledger, so the source account
  // only needs to be structurally valid — it does not need to exist on-chain
  // or hold funds. A fresh keypair each call keeps this stateless.
  const sourceAccount = new Account(Keypair.random().publicKey(), "0");

  const tx = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new ContractCallError(method, sim.error);
  }
  if (!sim.result) {
    throw new ContractCallError(method, "simulation returned no result");
  }
  return scValToNative(sim.result.retval) as T;
}

export async function fetchContractInfo(): Promise<ContractInfo> {
  const [admin, relaySigner, isPaused, isInitialised, schemaVersion, version] = await Promise.all([
    simulateRead<string>("admin"),
    simulateRead<string>("relay_signer"),
    simulateRead<boolean>("is_paused"),
    simulateRead<boolean>("health"),
    simulateRead<number>("schema_version"),
    simulateRead<string>("version"),
  ]);
  return { admin, relaySigner, isPaused, isInitialised, schemaVersion, version };
}

export async function fetchOnChainTransaction(txId: string): Promise<OnChainTransaction> {
  return simulateRead<OnChainTransaction>("get_transaction", [nativeToScVal(txId, { type: "string" })]);
}

export async function fetchOnChainStatus(txId: string): Promise<OnChainTransaction["status"]> {
  return simulateRead<OnChainTransaction["status"]>("get_status", [nativeToScVal(txId, { type: "string" })]);
}

export async function fetchPendingAdmin(): Promise<string | null> {
  return simulateRead<string | null>("pending_admin");
}

// ─── Writes: signed invocations, admin-gated ───────────────────────────────
//
// Security checklist item 1 (see CLAUDE.md): every admin action here goes
// through prepareTransaction -> wallet signature -> sendTransaction -> polled
// confirmation. Callers must treat the returned promise's resolution, not
// the wallet's "signed" callback, as the point the action actually happened.

export interface InvocationResult {
  hash: string;
  status: "SUCCESS";
  returnValue: unknown;
}

async function submitInvocation(
  method: string,
  args: xdr.ScVal[],
  signerAddress: string,
): Promise<InvocationResult> {
  const { contractId, rpcUrl, networkPassphrase } = getSorobanEnv();
  const server = new SorobanRpc.Server(rpcUrl);
  const contract = new Contract(contractId);

  const sourceAccount = await server.getAccount(signerAddress);
  const builtTx = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(builtTx);
  const signedXdr = await signTransactionXdr(prepared.toXDR(), signerAddress, networkPassphrase);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === "ERROR") {
    throw new ContractCallError(method, sendResult.errorResult?.toString() ?? "send failed");
  }

  // Poll until the network reports a terminal status — never assume success
  // just because the wallet signed and the node accepted the envelope.
  const hash = sendResult.hash;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const outcome = await server.getTransaction(hash);
    if (outcome.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return {
        hash,
        status: "SUCCESS",
        returnValue: outcome.returnValue ? scValToNative(outcome.returnValue) : undefined,
      };
    }
    if (outcome.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new ContractCallError(method, `transaction ${hash} failed on-chain`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new ContractCallError(method, `transaction ${hash} did not confirm in time`);
}

export function pauseContract(adminAddress: string): Promise<InvocationResult> {
  return submitInvocation("pause", [], adminAddress);
}

export function unpauseContract(adminAddress: string): Promise<InvocationResult> {
  return submitInvocation("unpause", [], adminAddress);
}

export function proposeAdmin(adminAddress: string, newAdmin: string): Promise<InvocationResult> {
  return submitInvocation(
    "propose_admin",
    [nativeToScVal(Address.fromString(newAdmin), { type: "address" })],
    adminAddress,
  );
}

export function acceptAdmin(nomineeAddress: string): Promise<InvocationResult> {
  return submitInvocation(
    "accept_admin",
    [nativeToScVal(Address.fromString(nomineeAddress), { type: "address" })],
    nomineeAddress,
  );
}

export function setRelaySigner(adminAddress: string, newSigner: string): Promise<InvocationResult> {
  return submitInvocation(
    "set_relay_signer",
    [nativeToScVal(Address.fromString(newSigner), { type: "address" })],
    adminAddress,
  );
}
