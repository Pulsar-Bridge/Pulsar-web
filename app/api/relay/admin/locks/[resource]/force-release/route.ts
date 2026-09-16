import { NextResponse } from "next/server";
import { relayAdminMutate, RelayNotConfiguredError } from "../../../../../../../lib/api/relay-server";

// Proxies POST /admin/locks/:resource/force-release
// (pulsar-core src/handlers/admin/locks.rs force_release_lock). Idempotent —
// releasing an already-released/expired lock still returns 200 with released: false.
export async function POST(_request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  try {
    const result = await relayAdminMutate(
      "POST",
      `/admin/locks/${encodeURIComponent(resource)}/force-release`,
    );
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
