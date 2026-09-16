# Pulsar Web

[![CI](https://github.com/Pulsar-Bridge/Pulsar-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Pulsar-Bridge/Pulsar-web/actions/workflows/ci.yml)

Pulsar Web is the dashboard component of the Pulsar Bridge project. It is a **wallet-connected
Next.js UI** for tracking fiat-to-Stellar deposit transactions in real time, with live Soroban
contract reads and an admin view into the bridge's state.

This repository is part of the larger Pulsar Bridge ecosystem. It never talks to Postgres or
Stellar Horizon directly — it reads the deployed Soroban contract over RPC and proxies every
relay call through its own `/api/relay/*` route handlers to `pulsar-core`.

## 🧱 Project Structure

```
Pulsar-web/
├── app/                          # Next.js App Router
│   ├── api/relay/                # Server-only proxy routes to the pulsar-core relay API
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # One folder per tab
│   ├── Shell.tsx                 # Tab shell/router
│   ├── transactions/             # Transaction list + detail drill-down
│   ├── settlements/
│   ├── stats/
│   ├── admin/                    # Contract admin actions, audit trail, webhook health
│   ├── docs/                     # In-app ABI/relay endpoint reference
│   └── ui/                       # Shared components (DataSourceBanner, etc.)
├── lib/
│   ├── soroban/contract.ts       # Soroban invoke/simulate encoding layer
│   ├── api/relay-client.ts       # Client-side relay calls (hit our own /api/relay/*, never pulsar-core directly)
│   ├── api/relay-server.ts       # Server-only relay fetch helper, used by the route handlers
│   ├── constants.ts              # ABI + relay endpoint reference, sourced from the sibling repos
│   ├── mock-data.ts              # Fallback data shaped identically to the live API/contract responses
│   ├── types.ts
│   └── wallet.ts                 # Freighter/xBull connection via stellar-wallets-kit
├── .env.example
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm — [Install](https://nodejs.org/)
- **Freighter** or **xBull** browser extension (optional for development) — needed to sign admin
  actions; without a connected wallet the dashboard is still fully browsable read-only
- A running `pulsar-core` relay instance and a deployed `SynapseCoreContract` (optional — see
  below)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pulsar-Bridge/Pulsar-web.git
   cd Pulsar-web
   ```
2. Set up environment variables

   ```bash
   cp .env.example .env.local
   ```

   The variables are:

   | Variable                                 | Exposure    | Purpose                                                                                                                                                               |
   | ---------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_CONTRACT_ID`                | client      | Deployed `SynapseCoreContract` ID. Without it, the Admin tab and any on-chain read falls back to mock data.                                                           |
   | `NEXT_PUBLIC_SOROBAN_RPC_URL`            | client      | Soroban RPC endpoint. Defaults to the public testnet RPC.                                                                                                             |
   | `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | client      | Network passphrase; determines testnet vs. mainnet wallet-kit behavior.                                                                                               |
   | `RELAY_API_BASE_URL`                     | server-only | Base URL of the `pulsar-core` relay API.                                                                                                                              |
   | `RELAY_API_KEY`                          | server-only | Tenant `X-API-Key` used by `app/api/relay/transactions` and `.../settlements`. Never prefix this `NEXT_PUBLIC_` — it is only ever read inside Next.js Route Handlers. |
   | `RELAY_ADMIN_API_KEY`                    | server-only | Admin bearer key used by `app/api/relay/stats/*` and `/admin/*`. Same rule: server-only.                                                                              |

3. Install dependencies
   ```bash
   npm install
   ```
4. Run the dev server
   ```bash
   npm run dev
   ```

Without any env vars set, every tab falls back to `lib/mock-data.ts` so the UI stays explorable.

### Testing

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Matches CI (`.github/workflows/ci.yml`) exactly. A Husky pre-commit hook runs lint-staged +
typecheck locally.

## 📡 Relay API Proxy

`pulsar-core`'s tenant-scoped data routes (`/transactions*`, `/settlements*`) and admin routes
(`/stats/*`, `/admin/*`) require an `X-API-Key` or `Authorization: Bearer` credential. Those are
long-lived secrets tied to this dashboard's tenant — they must never ship to the browser. Every
relay call from a client component goes through `app/api/relay/*`, which attaches the real
credential server-side and forwards the response (or a distinct `relay_not_configured` /
`relay_unreachable` error) back to the browser.

## 🧩 New Tab Checklist

1. Create `components/<name>/<Name>Tab.tsx`.
2. Add the tab name to `TABS` in `components/Shell.tsx`.
3. Add the render branch in `Shell.tsx`, wrapped in `<TabErrorBoundary>`.
4. If the tab reads from the relay, add a proxy route under `app/api/relay/*` and a client
   function in `lib/api/relay-client.ts` — don't call the relay directly from a client component.
5. If the tab shows data with no live source yet, add matching shapes to `lib/mock-data.ts` and
   show `<DataSourceBanner source="mock" />` — never fall back silently.

## 📋 Roadmap / Open Items

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
- [x] Webhook endpoint health (`components/admin/WebhookHealthPanel.tsx`,
      `/admin/webhooks/health` proxy) — read-only delivery success rate per endpoint.
- [x] Tenant quota management (`components/admin/TenantQuotasPanel.tsx`, `/admin/quotas*` proxies)
      — per-tenant rate limit and usage window, with set-limit and reset-window admin actions.
- [x] Distributed lock visibility (`components/admin/ActiveLocksPanel.tsx`, `/admin/locks*`
      proxies) — lists locks held by the relay instance, with a confirm-gated force-release action.
- [x] Compliance reporting (`components/admin/ComplianceReportsPanel.tsx`,
      `/admin/compliance/reports` proxy) — lists generated reports and generates new ones by period.
- [ ] Webhook filter rules / reconciliation admin views — `pulsar-core` exposes these
      (`/admin/reconciliation`, webhook filter rule CRUD) but this dashboard doesn't surface them
      yet.
- [ ] `pulsar-swap` (Phase 2) integration — sibling repo doesn't exist yet.

## 🔗 Sibling Repos

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

## 🤝 Contributing

**Quick start for contributors:**

1. Fork the repository and create a branch from `main`.
2. Set up your development environment (see [Getting Started](#-getting-started) above).
3. Follow the [New Tab Checklist](#-new-tab-checklist) when adding a tab or relay-backed view.
4. Ensure all checks pass: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
5. Open a pull request against `main` with a clear description.
