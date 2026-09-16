import { NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../lib/api/relay-server";

// Proxies GET /stats/status (pulsar-core src/handlers/stats.rs status_counts).
// Admin-key gated upstream — requires RELAY_ADMIN_API_KEY server-side.
export async function GET() {
  try {
    const result = await relayAdminGet("/stats/status");
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
