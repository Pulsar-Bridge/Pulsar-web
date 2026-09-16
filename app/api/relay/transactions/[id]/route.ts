import { NextResponse } from "next/server";
import { relayGet, RelayNotConfiguredError } from "../../../../../lib/api/relay-server";

// Proxies GET /transactions/:id (pulsar-core src/handlers/webhook.rs get_transaction).
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const result = await relayGet(`/transactions/${encodeURIComponent(id)}`);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
