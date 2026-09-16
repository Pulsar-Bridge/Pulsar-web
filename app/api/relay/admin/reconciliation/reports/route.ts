import { NextRequest, NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../../lib/api/relay-server";

// Proxies GET /admin/reconciliation/reports
// (pulsar-core src/handlers/admin/reconciliation.rs list_reconciliation_reports).
export async function GET(request: NextRequest) {
  try {
    const result = await relayAdminGet("/admin/reconciliation/reports", request.nextUrl.searchParams);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
