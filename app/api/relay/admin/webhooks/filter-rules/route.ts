import { NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../../lib/api/relay-server";

// Proxies GET /admin/webhooks/filter-rules
// (pulsar-core src/handlers/admin/webhook_filter_rules.rs list_endpoints_with_filter_rules).
export async function GET() {
  try {
    const result = await relayAdminGet("/admin/webhooks/filter-rules");
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
