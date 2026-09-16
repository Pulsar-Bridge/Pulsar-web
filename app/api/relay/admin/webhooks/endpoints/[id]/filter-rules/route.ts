import { NextRequest, NextResponse } from "next/server";
import {
  relayAdminGet,
  relayAdminMutate,
  RelayNotConfiguredError,
} from "../../../../../../../../lib/api/relay-server";

// Proxies /admin/webhooks/endpoints/:id/filter-rules
// (pulsar-core src/handlers/admin/webhook_filter_rules.rs
// get_filter_rules / set_filter_rules / delete_filter_rules).

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const result = await relayAdminGet(`/admin/webhooks/endpoints/${encodeURIComponent(id)}/filter-rules`);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}

// Body: { filter_rules: object | null }. null clears all rules (deliver everything).
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await relayAdminMutate(
      "PUT",
      `/admin/webhooks/endpoints/${encodeURIComponent(id)}/filter-rules`,
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

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const result = await relayAdminMutate(
      "DELETE",
      `/admin/webhooks/endpoints/${encodeURIComponent(id)}/filter-rules`,
    );
    return new NextResponse(null, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
