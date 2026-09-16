import { NextRequest, NextResponse } from "next/server";
import { relayGet, RelayNotConfiguredError } from "../../../../lib/api/relay-server";

// Proxies GET /settlements (pulsar-core src/handlers/settlements.rs list_settlements).
export async function GET(request: NextRequest) {
  try {
    const result = await relayGet("/settlements", request.nextUrl.searchParams);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
