import { NextResponse } from "next/server";
import { relayAdminGet, RelayNotConfiguredError } from "../../../../../../../lib/api/relay-server";

// Proxies GET /admin/reconciliation/reports/:id
// (pulsar-core src/handlers/admin/reconciliation.rs get_reconciliation_report).
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const result = await relayAdminGet(`/admin/reconciliation/reports/${encodeURIComponent(id)}`);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
