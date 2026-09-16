import { NextRequest, NextResponse } from "next/server";
import {
  relayAdminGet,
  relayAdminMutate,
  RelayNotConfiguredError,
} from "../../../../../../lib/api/relay-server";

// Proxies GET /admin/quotas/:tenant_id (pulsar-core src/handlers/admin/quota.rs get_tenant_quota).
export async function GET(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  try {
    const result = await relayAdminGet(`/admin/quotas/${encodeURIComponent(tenantId)}`);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}

// Proxies PUT /admin/quotas/:tenant_id (pulsar-core src/handlers/admin/quota.rs set_tenant_quota).
// Body: { custom_limit: number }.
export async function PUT(request: NextRequest, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  try {
    const body = await request.json();
    const result = await relayAdminMutate("PUT", `/admin/quotas/${encodeURIComponent(tenantId)}`, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
