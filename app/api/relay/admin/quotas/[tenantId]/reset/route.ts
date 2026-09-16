import { NextResponse } from "next/server";
import { relayAdminMutate, RelayNotConfiguredError } from "../../../../../../../lib/api/relay-server";

// Proxies DELETE /admin/quotas/:tenant_id/reset (pulsar-core src/handlers/admin/quota.rs reset_tenant_quota).
export async function DELETE(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  try {
    const result = await relayAdminMutate("DELETE", `/admin/quotas/${encodeURIComponent(tenantId)}/reset`);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
