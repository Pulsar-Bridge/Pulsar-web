# Pulsar-web

Next.js dashboard for Pulsar Bridge — wallet-connected UI for tracking fiat-to-Stellar deposit
transactions in real time, with live Soroban contract reads and an admin view into the bridge's
state.

## Stack

- Next.js 16 (App Router) / React 19 / TypeScript
- Tailwind CSS
- `@creit.tech/stellar-wallets-kit` for Freighter/xBull wallet connection
- `@stellar/stellar-sdk` for Soroban contract reads/writes

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without any env vars set, every tab falls back to `lib/mock-data.ts` so the UI stays explorable.

## Environment variables

| Variable                                 | Exposure    | Purpose                                                                                                                                                               |
| ---------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CONTRACT_ID`                | client      | Deployed `SynapseCoreContract` ID. Without it, the Admin tab and any on-chain read falls back to mock data.                                                           |
| `NEXT_PUBLIC_SOROBAN_RPC_URL`            | client      | Soroban RPC endpoint. Defaults to the public testnet RPC.                                                                                                             |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | client      | Network passphrase; determines testnet vs. mainnet wallet-kit behavior.                                                                                               |
| `RELAY_API_BASE_URL`                     | server-only | Base URL of the `pulsar-core` relay API.                                                                                                                              |
| `RELAY_API_KEY`                          | server-only | Tenant `X-API-Key` used by `app/api/relay/transactions` and `.../settlements`. Never prefix this `NEXT_PUBLIC_` — it is only ever read inside Next.js Route Handlers. |
| `RELAY_ADMIN_API_KEY`                    | server-only | Admin bearer key used by `app/api/relay/stats/*`. Same rule: server-only.                                                                                             |

## Architecture

- `app/` — routes, layout, and the `/api/relay/*` proxy route handlers.
- `components/` — one folder per tab (`transactions/`, `settlements/`, `stats/`, `admin/`, `docs/`)
  plus shared `components/ui/`.
- `lib/soroban/contract.ts` — the Soroban invoke/simulate encoding layer. Stable; extend it with new
  read/write wrappers rather than rewriting the core `simulateRead`/`submitInvocation` functions.
- `lib/api/relay-client.ts` — client-side relay API calls. These hit this app's own `/api/relay/*`
  routes, never the relay directly, so tenant/admin API keys stay server-side.
- `lib/api/relay-server.ts` — server-only relay fetch helper used by the route handlers.
- `lib/mock-data.ts` — fallback data shaped identically to the live API/contract responses.

### Why a same-origin API proxy for the relay

`pulsar-core`'s tenant-scoped data routes (`/transactions*`, `/settlements*`) and admin routes
(`/stats/*`) require an `X-API-Key` or `Authorization: Bearer` credential. Those are long-lived
secrets tied to this dashboard's tenant — they must never ship to the browser. Every relay call
from a client component goes through `app/api/relay/*`, which attaches the real credential
server-side and forwards the response (or a distinct `relay_not_configured` / `relay_unreachable`
error) back to the browser.

## New tab checklist

1. Create `components/<name>/<Name>Tab.tsx`.
2. Add the tab name to `TABS` in `components/Shell.tsx`.
3. Add the render branch in `Shell.tsx`, wrapped in `<TabErrorBoundary>`.
4. If the tab reads from the relay, add a proxy route under `app/api/relay/*` and a client
   function in `lib/api/relay-client.ts` — don't call the relay directly from a client component.
5. If the tab shows data with no live source yet, add matching shapes to `lib/mock-data.ts` and
   show `<DataSourceBanner source="mock" />` — never fall back silently.

## Before merge

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Matches CI (`.github/workflows/ci.yml`) exactly. A Husky pre-commit hook runs lint-staged +
typecheck locally.

## Roadmap / open items

- [x] Wallet connection (Freighter/xBull) via `@creit.tech/stellar-wallets-kit`.
- [x] Soroban contract read layer (`admin`, `relay_signer`, `is_paused`, `health`, `version`,
      `get_transaction`, `get_status`, `pending_admin`).
- [x] Soroban contract write layer for admin actions (`pause`, `unpause`, `propose_admin`,
      `accept_admin`, `set_relay_signer`) — signed via the connected wallet, confirmed by polling
      `getTransaction` before updating UI state.
- [x] `admin` / `relay_signer` now come directly from the contract's own `admin()` /
      `relay_signer()` getters (added in `pulsar-core-contracts`) instead of `lib/mock-data.ts` —
      this closes the gap called out in earlier planning, where the ABI had no such getter.
- [x] Relay API client for `pulsar-core`'s tenant-scoped read routes (`/transactions`,
      `/transactions/:id`, `/settlements`, `/settlements/:id`) and admin stats routes
      (`/stats/status`, `/stats/daily`, `/stats/assets`), proxied through `/api/relay/*`.
- [x] Transaction detail drill-down (`components/transactions/detail/TransactionDetail.tsx`) —
      cross-references the on-chain `get_transaction` record against the relay's DB row for the
      same ID and flags a status mismatch instead of trusting either source alone.
- [x] Admin audit trail (`components/admin/AuditLogPanel.tsx`, `/admin/audit/search` proxy) —
      read-only view of recent audit log entries.
- [ ] Webhook filter rules / reconciliation / compliance-report admin views — `pulsar-core` exposes
      these (`/admin/reconciliation`, `/admin/compliance/reports`, webhook filter rule CRUD) but
      this dashboard doesn't surface them yet.
- [ ] `pulsar-swap` (Phase 2) integration — sibling repo doesn't exist yet.

## Sibling repos

```
pulsar-core:             https://github.com/Synapse-bridgez/synapse-core
pulsar-core-contracts:   https://github.com/Synapse-bridgez/synapse-core-contracts
pulsar-swap:             <does not exist yet>
```

Clone as siblings for cross-repo work:

```bash
git clone https://github.com/Synapse-bridgez/synapse-core.git ../pulsar-core
git clone https://github.com/Synapse-bridgez/synapse-core-contracts.git ../pulsar-core-contracts
```

Before wiring a new tab or API client to "what the backend probably returns," open the sibling
repo and read the actual handler or contract entry point — see `lib/constants.ts` and
`lib/soroban/contract.ts` for how the current ABI/relay surface was derived directly from
`pulsar-core-contracts/src/lib.rs` and `pulsar-core/src/lib.rs`.
