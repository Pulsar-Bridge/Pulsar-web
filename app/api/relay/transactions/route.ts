import { NextRequest, NextResponse } from "next/server";
import { relayGet, RelayNotConfiguredError } from "../../../../lib/api/relay-server";

// Proxies GET /transactions from pulsar-core (src/handlers/webhook.rs
// list_transactions_api). Forwards the same query params it accepts:
// cursor, limit, direction, from_date, to_date.
export async function GET(request: NextRequest) {
  try {
    const result = await relayGet("/transactions", request.nextUrl.searchParams);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
