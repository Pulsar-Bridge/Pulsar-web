import { NextRequest, NextResponse } from "next/server";
import {
  relayAdminGet,
  relayAdminMutate,
  RelayNotConfiguredError,
} from "../../../../../../lib/api/relay-server";

// Proxies GET /admin/compliance/reports (pulsar-core src/handlers/admin/compliance.rs list_reports).
// Query params: period, limit, offset.
export async function GET(request: NextRequest) {
  try {
    const result = await relayAdminGet("/admin/compliance/reports", request.nextUrl.searchParams);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}

// Proxies POST /admin/compliance/reports?period=<str>
// (pulsar-core src/handlers/admin/compliance.rs generate_report). `period`
// is a query param despite this being a POST — pulsar-core's handler takes
// it via axum's Query extractor, not a JSON body.
export async function POST(request: NextRequest) {
  try {
    const result = await relayAdminMutate(
      "POST",
      "/admin/compliance/reports",
      undefined,
      request.nextUrl.searchParams,
    );
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    if (err instanceof RelayNotConfiguredError) {
      return NextResponse.json({ error: "relay_not_configured", detail: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "relay_unreachable" }, { status: 502 });
  }
}
