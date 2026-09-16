// ABI reference for DocsTab.tsx. Sourced directly from
// ../pulsar-core-contracts/src/lib.rs — update this the same PR the sibling
// contract adds, removes, or changes an entry point's signature.

export type AbiMutability = "read" | "write" | "admin";

export interface AbiEndpoint {
  name: string;
  mutability: AbiMutability;
  signature: string;
  description: string;
}

export const ABI_ENDPOINTS: AbiEndpoint[] = [
  {
    name: "initialize",
    mutability: "admin",
    signature: "initialize(admin: Address, relay_signer: Address) -> Result<(), ContractError>",
    description: "One-time setup. Sets the admin and trusted relay signer, starts unpaused.",
  },
  {
    name: "register_callback",
    mutability: "write",
    signature: "register_callback(payload: CallbackPayload) -> Result<String, ContractError>",
    description:
      "Relay-signer only. Registers a new anchor callback as a Pending transaction, idempotent by idempotency_key.",
  },
  {
    name: "start_processing",
    mutability: "write",
    signature: "start_processing(tx_id: String, caller: Address) -> Result<(), ContractError>",
    description: "Admin or relay signer. Transitions Pending → Processing.",
  },
  {
    name: "complete_transaction",
    mutability: "write",
    signature:
      "complete_transaction(tx_id: String, stellar_tx_hash: String, caller: Address) -> Result<(), ContractError>",
    description: "Admin or relay signer. Transitions Processing → Completed, records the settlement tx hash.",
  },
  {
    name: "fail_transaction",
    mutability: "write",
    signature:
      "fail_transaction(tx_id: String, reason: String, caller: Address) -> Result<(), ContractError>",
    description: "Admin or relay signer. Transitions Pending/Processing → Failed with a reason code.",
  },
  {
    name: "get_transaction",
    mutability: "read",
    signature: "get_transaction(tx_id: String) -> Result<Transaction, ContractError>",
    description: "Returns the full on-chain transaction record.",
  },
  {
    name: "get_status",
    mutability: "read",
    signature: "get_status(tx_id: String) -> Result<TransactionStatus, ContractError>",
    description: "Returns just the current status, cheaper than a full get_transaction.",
  },
  {
    name: "is_duplicate",
    mutability: "read",
    signature: "is_duplicate(idempotency_key: String) -> bool",
    description: "Checks whether an idempotency key has already been processed.",
  },
  {
    name: "admin",
    mutability: "read",
    signature: "admin() -> Result<Address, ContractError>",
    description: "Returns the current admin address. Lets the dashboard verify on-chain admin directly.",
  },
  {
    name: "relay_signer",
    mutability: "read",
    signature: "relay_signer() -> Result<Address, ContractError>",
    description: "Returns the current trusted relay signer address.",
  },
  {
    name: "schema_version",
    mutability: "read",
    signature: "schema_version() -> Result<u32, ContractError>",
    description: "Returns the on-chain storage schema version, required as input to upgrade().",
  },
  {
    name: "pending_admin",
    mutability: "read",
    signature: "pending_admin() -> Option<Address>",
    description: "Returns the nominated next admin, if an admin transfer is in progress.",
  },
  {
    name: "propose_admin",
    mutability: "admin",
    signature: "propose_admin(new_admin: Address) -> Result<(), ContractError>",
    description:
      "Admin-gated. Nominates a new admin; the transfer only completes once new_admin calls accept_admin.",
  },
  {
    name: "accept_admin",
    mutability: "write",
    signature: "accept_admin(caller: Address) -> Result<(), ContractError>",
    description: "Callable only by the pending nominee. Finalizes a two-step admin transfer.",
  },
  {
    name: "set_relay_signer",
    mutability: "admin",
    signature: "set_relay_signer(new_signer: Address) -> Result<(), ContractError>",
    description: "Admin-gated. Rotates the trusted relay signer address.",
  },
  {
    name: "upgrade",
    mutability: "admin",
    signature:
      "upgrade(new_wasm_hash: BytesN<32>, expected_schema_version: u32) -> Result<(), ContractError>",
    description:
      "Admin-gated. Replaces the contract WASM in place; requires the current schema version as a guard.",
  },
  {
    name: "pause",
    mutability: "admin",
    signature: "pause() -> Result<(), ContractError>",
    description:
      "Admin-gated. Engages the emergency circuit breaker — blocks new register_callback ingestion only.",
  },
  {
    name: "unpause",
    mutability: "admin",
    signature: "unpause() -> Result<(), ContractError>",
    description: "Admin-gated. Releases the emergency circuit breaker.",
  },
  {
    name: "is_paused",
    mutability: "read",
    signature: "is_paused() -> bool",
    description: "Returns whether the emergency pause is currently engaged.",
  },
  {
    name: "health",
    mutability: "read",
    signature: "health() -> bool",
    description: "Liveness probe. True once initialize() has been called.",
  },
  {
    name: "version",
    mutability: "read",
    signature: "version() -> String",
    description: "Returns the deployed contract's semver string.",
  },
];

// Relay API endpoints this dashboard consumes, proxied through
// app/api/relay/* so the tenant API key never reaches the browser.
// Sourced from ../pulsar-core/src/lib.rs `create_app`.
export const RELAY_ENDPOINTS = [
  { method: "GET", path: "/transactions", description: "Cursor-paginated transaction list, tenant-scoped." },
  { method: "GET", path: "/transactions/:id", description: "Single transaction by ID, tenant-scoped." },
  { method: "GET", path: "/settlements", description: "Cursor-paginated settlement list, tenant-scoped." },
  { method: "GET", path: "/settlements/:id", description: "Single settlement by ID, tenant-scoped." },
  {
    method: "GET",
    path: "/stats/status",
    description: "Transaction counts grouped by status. Admin-key gated.",
  },
  { method: "GET", path: "/stats/daily", description: "Daily transaction volume totals. Admin-key gated." },
  { method: "GET", path: "/stats/assets", description: "Per-asset volume/average stats. Admin-key gated." },
  {
    method: "GET",
    path: "/admin/audit/search",
    description: "Searchable audit trail across all entities. Admin-key gated.",
  },
  {
    method: "GET",
    path: "/admin/webhooks/health",
    description: "Delivery success rate per webhook endpoint. Admin-key gated.",
  },
  {
    method: "GET",
    path: "/admin/quotas",
    description: "Per-tenant rate limit and current usage window. Admin-key gated.",
  },
  {
    method: "GET",
    path: "/admin/quotas/:tenant_id",
    description: "Rate limit and usage window for a single tenant. Admin-key gated.",
  },
  {
    method: "PUT",
    path: "/admin/quotas/:tenant_id",
    description: "Overrides a tenant's per-minute rate limit. Admin-key gated.",
  },
  {
    method: "DELETE",
    path: "/admin/quotas/:tenant_id/reset",
    description: "Resets a tenant's current usage window early. Admin-key gated.",
  },
  {
    method: "GET",
    path: "/admin/locks",
    description: "Lists distributed locks currently held by this relay instance. Admin-key gated.",
  },
  {
    method: "POST",
    path: "/admin/locks/:resource/force-release",
    description: "Force-releases a distributed lock regardless of owner. Admin-key gated, idempotent.",
  },
  {
    method: "GET",
    path: "/admin/compliance/reports",
    description: "Lists previously generated compliance reports. Admin-key gated.",
  },
  {
    method: "POST",
    path: "/admin/compliance/reports",
    description: "Generates a new compliance report for a period (query param). Admin-key gated.",
  },
  {
    method: "GET",
    path: "/cache/metrics",
    description: "Query cache hit/miss counters. Mounted at relay root, admin-key gated.",
  },
] as const;
