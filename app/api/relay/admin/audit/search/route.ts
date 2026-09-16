import { NextRequest, NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../../lib/api/relay-server";

// Proxies GET /admin/audit/search (pulsar-core src/handlers/admin/audit.rs search_audit_logs_handler).
export async function GET(request: NextRequest) {
  try {
    const result = await relayAdminGet("/admin/audit/search", request.nextUrl.searchParams);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
