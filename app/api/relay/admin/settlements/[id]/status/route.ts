import { NextRequest, NextResponse } from "next/server";
import { relayAdminMutate, RelayNotConfiguredError } from "../../../../../../../lib/api/relay-server";

// Proxies PATCH /admin/settlements/:id/status
// (pulsar-core src/handlers/settlements.rs update_settlement_status). Body:
// { status: string, reason?: string, new_total?: string, actor?: string }.
// Server-side enforces the SETTLEMENT_TRANSITIONS state machine — a rejected
// transition comes back as a 400 with "invalid transition: X -> Y".
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await relayAdminMutate(
      "PATCH",
      `/admin/settlements/${encodeURIComponent(id)}/status`,
      body,
    );
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
