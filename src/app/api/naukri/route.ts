import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to the Naukri applier service (naukri-service/naukri_service.py).
 * Supports GET /api/naukri?action=status and POST /api/naukri (start run).
 * NAUKRI_SERVICE_URL defaults to http://localhost:4000 for local dev.
 */

const NAUKRI_URL = process.env.NAUKRI_SERVICE_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") ?? "status";
  const endpoint = action === "stop" ? "/stop" : "/status";
  try {
    const res = await fetch(`${NAUKRI_URL}${endpoint}`, {
      method: action === "stop" ? "POST" : "GET",
      signal: AbortSignal.timeout(8_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Naukri service unreachable — start it with: docker compose --profile naukri up -d" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${NAUKRI_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Naukri service unreachable — start it with: docker compose --profile naukri up -d" }, { status: 503 });
  }
}
