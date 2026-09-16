// Server-only helper for talking to the pulsar-core relay API. This must
// never be imported from a client component: it reads RELAY_API_KEY, the
// tenant secret, which is deliberately NOT prefixed NEXT_PUBLIC_ so it never
// ships in the browser bundle. app/api/relay/* route handlers use this to
// proxy requests, attaching the key server-side.

import "server-only";

export class RelayNotConfiguredError extends Error {
  constructor() {
    super("RELAY_API_BASE_URL is not set.");
    this.name = "RelayNotConfiguredError";
  }
}

export interface RelayFetchResult {
  status: number;
  body: unknown;
}

/**
 * Proxies a GET request to the relay's tenant-scoped data routes
 * (see ../../pulsar-core/src/lib.rs `data_routes`). Returns the upstream
 * status and JSON body as-is — callers decide how to surface failures
 * rather than this helper silently swallowing them.
 */
export async function relayGet(path: string, searchParams?: URLSearchParams): Promise<RelayFetchResult> {
  const baseUrl = process.env.RELAY_API_BASE_URL;
  const apiKey = process.env.RELAY_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new RelayNotConfiguredError();
  }

  const url = new URL(path, baseUrl);
  if (searchParams) {
    searchParams.forEach((value, key) => url.searchParams.set(key, value));
  }

  const response = await fetch(url, {
    headers: { "X-API-Key": apiKey },
    // Relay data changes frequently; never cache tenant data at the fetch layer.
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

/** Same as relayGet but authenticates with the admin bearer key (stats/admin routes). */
export async function relayAdminGet(path: string, searchParams?: URLSearchParams): Promise<RelayFetchResult> {
  const baseUrl = process.env.RELAY_API_BASE_URL;
  const adminKey = process.env.RELAY_ADMIN_API_KEY;
  if (!baseUrl || !adminKey) {
    throw new RelayNotConfiguredError();
  }

  const url = new URL(path, baseUrl);
  if (searchParams) {
    searchParams.forEach((value, key) => url.searchParams.set(key, value));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${adminKey}` },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}
