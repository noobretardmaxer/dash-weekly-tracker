import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const UPSTREAM_TIMEOUT_MS = 15_000;

function errorResponse(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const targetUrl = `${API_URL}/api/v1/${path.join("/")}${request.nextUrl.search}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const cookie = request.headers.get("cookie");
  if (cookie) headers.cookie = cookie;

  const init: RequestInit = {
    method: request.method,
    headers,
    // Surface redirects instead of silently following an auth gateway to an
    // HTML login page (which the client can't parse as JSON).
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) init.body = body;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(targetUrl, { ...init, signal: controller.signal });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) {
      // Common on a cold-started backend — clearer than an infinite skeleton.
      return errorResponse(
        "UPSTREAM_TIMEOUT",
        `The API did not respond within ${UPSTREAM_TIMEOUT_MS / 1000}s (it may be starting up). Please retry.`,
        504,
        { target: API_URL }
      );
    }
    // The #1 prod misconfig: API_URL unset/wrong → connection refused. Name it.
    return errorResponse(
      "UPSTREAM_UNREACHABLE",
      `Could not reach the API at ${API_URL}. Check the frontend's API_URL environment variable and that the backend service is running.`,
      502,
      { target: API_URL, cause: err instanceof Error ? err.message : String(err) }
    );
  } finally {
    clearTimeout(timeout);
  }

  // A redirect on an API path almost always means an intermediary (auth gateway,
  // or a misrouted API_URL) intercepted the request rather than the JSON API
  // answering. `redirect: "manual"` yields either a 3xx or an opaqueredirect
  // (status 0) depending on the runtime — treat both as a clear upstream error.
  if (response.type === "opaqueredirect" || response.status === 0 || (response.status >= 300 && response.status < 400)) {
    return errorResponse(
      "UPSTREAM_REDIRECT",
      "The API request was redirected instead of answered — an auth gateway or a misrouted API_URL is likely intercepting it.",
      502,
      { target: API_URL, upstreamStatus: response.status || null, location: response.headers.get("location") }
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  const nextResponse = NextResponse.json(payload, { status: response.status });
  for (const setCookie of response.headers.getSetCookie()) {
    nextResponse.headers.append("set-cookie", setCookie);
  }
  return nextResponse;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
