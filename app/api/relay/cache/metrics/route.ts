import { NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../lib/api/relay-server";

// Proxies GET /cache/metrics (pulsar-core src/handlers/stats.rs cache_metrics).
// Mounted at the relay's root, not under /admin, but still admin-key gated.
export async function GET() {
  try {
    const result = await relayAdminGet("/cache/metrics");
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
