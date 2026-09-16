import { NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../lib/api/relay-server";

// Proxies GET /admin/locks (pulsar-core src/handlers/admin/locks.rs list_active_locks).
export async function GET() {
  try {
    const result = await relayAdminGet("/admin/locks");
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
