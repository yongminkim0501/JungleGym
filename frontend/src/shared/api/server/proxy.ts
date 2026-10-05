import type { NextRequest } from "next/server";

const maxProxyBodyBytes = 15 * 1024 * 1024;

const hopByHopHeaders = new Set([
  "authorization",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "content-encoding",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
  "forwarded",
]);

const responseBlockedHeaders = new Set([
  ...hopByHopHeaders,
  "set-cookie",
  "content-encoding",
]);

const allowedRoutes = [
  { method: "GET", path: "/api/auth/csrf" },
  { method: "GET", path: "/api/auth/me" },
  { method: "POST", path: "/api/auth/register" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/logout" },
  { method: "POST", path: "/api/recovery/send-code" },
  { method: "POST", path: "/api/recovery/verify-code" },
  { method: "POST", path: "/api/recovery/reset-password" },
  { method: "POST", path: "/api/gym/check-in" },
  { method: "POST", path: "/api/gym/check-out" },
  { method: "GET", path: "/api/gym/visits" },
  { method: "GET", path: "/api/dashboard" },
  { method: "GET", path: "/api/admin/auth/csrf" },
  { method: "POST", path: "/api/admin/auth/login" },
  { method: "POST", path: "/api/admin/auth/logout" },
  { method: "GET", path: "/api/admin/auth/me" },
  { method: "GET", path: "/api/admin/data" },
  { method: "GET", path: "/api/admin/metrics" },
] as const;

type RouteParams = {
  path?: string[];
};

type MaybePromise<T> = T | Promise<T>;

class PayloadTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "PayloadTooLargeError";
  }
}

export function backendOrigin() {
  const rawOrigin = process.env.SPRING_API_ORIGIN;
  if (!rawOrigin) return null;

  try {
    const origin = new URL(rawOrigin);
    if (origin.protocol !== "http:" && origin.protocol !== "https:")
      return null;
    if (origin.username || origin.password) return null;
    if (origin.pathname !== "/" || origin.search || origin.hash) return null;

    return origin.origin;
  } catch {
    return null;
  }
}

function apiPath(path: string[] | undefined) {
  const cleanPath = (path ?? []).map(encodeURIComponent).join("/");
  return `/api/${cleanPath}`;
}

function isAllowed(method: string, path: string) {
  if (method === "PATCH" && /^\/api\/admin\/users\/[1-9]\d*$/.test(path)) return true;
  return allowedRoutes.some(
    (route) => route.method === method && route.path === path,
  );
}

function upstreamUrl(request: NextRequest, params: RouteParams) {
  const origin = backendOrigin();
  if (!origin) return null;

  const path = apiPath(params.path);
  if (!isAllowed(request.method, path)) return "forbidden";

  const url = new URL(path, origin);
  url.search = request.nextUrl.search;

  return url;
}

function forwardedHeaders(request: NextRequest, requestId: string) {
  const headers = new Headers();
  const connectionHeaders = new Set(
    (request.headers.get("connection") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  for (const [key, value] of request.headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (hopByHopHeaders.has(lowerKey) || connectionHeaders.has(lowerKey))
      continue;
    if (lowerKey.startsWith("sec-")) continue;
    headers.set(key, value);
  }

  headers.set("Cache-Control", "no-store");
  // Always issue a fresh ID; a client-supplied one is not trusted for log correlation.
  headers.set("X-Request-Id", requestId);

  return headers;
}

async function readBoundedBody(request: NextRequest) {
  if (!request.body) return undefined;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    if (request.signal.aborted) {
      throw (
        request.signal.reason ??
        new DOMException("Request aborted", "AbortError")
      );
    }

    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > maxProxyBodyBytes) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }

    chunks.push(value);
  }

  const buffer = new ArrayBuffer(received);
  const body = new Uint8Array(buffer);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return buffer;
}

function responseHeaders(upstreamHeaders: Headers) {
  const headers = new Headers();
  const connectionHeaders = new Set(
    (upstreamHeaders.get("connection") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  for (const [key, value] of upstreamHeaders.entries()) {
    const lowerKey = key.toLowerCase();
    if (responseBlockedHeaders.has(lowerKey) || connectionHeaders.has(lowerKey))
      continue;
    headers.set(key, value);
  }

  headers.set("Cache-Control", "no-store");

  const getSetCookie = (
    upstreamHeaders as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  const setCookies =
    typeof getSetCookie === "function"
      ? getSetCookie.call(upstreamHeaders)
      : [];

  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      headers.append("Set-Cookie", cookie);
    }
  } else {
    const cookie = upstreamHeaders.get("set-cookie");
    if (cookie) headers.append("Set-Cookie", cookie);
  }

  return headers;
}

function json(status: number, body: unknown) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function proxyRequest(
  request: NextRequest,
  rawParams: MaybePromise<RouteParams>,
) {
  const params = await rawParams;
  const url = upstreamUrl(request, params);

  if (!url) {
    return json(503, {
      success: false,
      message: "서버와 연결할 수 없습니다.",
    });
  }
  if (url === "forbidden") {
    return json(403, {
      success: false,
      message: "요청 권한이 없습니다.",
    });
  }

  let body: ArrayBuffer | undefined;
  try {
    body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await readBoundedBody(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return new Response("Payload Too Large", {
        status: 413,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    throw error;
  }

  const requestId = crypto.randomUUID();
  const init: RequestInit = {
    method: request.method,
    headers: forwardedHeaders(request, requestId),
    redirect: "manual",
    signal: request.signal,
  };

  if (body !== undefined) {
    init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      ...init,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;

    // Spring never saw this request, so this line in the platform log is the only trace.
    console.error(
      `[proxy] ${request.method} ${url.pathname} -> Spring unreachable (requestId=${requestId})`,
      error,
    );
    return Response.json(
      {
        success: false,
        message: "Spring API에 연결할 수 없습니다.",
        requestId,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders(upstream.headers),
  });
}
