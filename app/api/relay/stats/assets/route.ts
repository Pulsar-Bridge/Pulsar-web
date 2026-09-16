import { NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../lib/api/relay-server";

// Proxies GET /stats/assets (pulsar-core src/handlers/stats.rs asset_stats).
export async function GET() {
  try {
    const result = await relayAdminGet("/stats/assets");
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
