import { NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../../lib/api/relay-server";

// Proxies GET /admin/webhooks/health (pulsar-core src/handlers/admin/mod.rs list_webhook_health).
export async function GET() {
  try {
    const result = await relayAdminGet("/admin/webhooks/health");
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
