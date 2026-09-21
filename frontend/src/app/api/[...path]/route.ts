import type { NextRequest } from "next/server";

import { proxyRequest } from "@/shared/api/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    path?: string[];
  }>;
};

export function GET(request: NextRequest, context: Context) {
  return proxyRequest(request, context.params);
}

export function POST(request: NextRequest, context: Context) {
  return proxyRequest(request, context.params);
}

export function PUT(request: NextRequest, context: Context) {
  return proxyRequest(request, context.params);
}

export function PATCH(request: NextRequest, context: Context) {
  return proxyRequest(request, context.params);
}

export function DELETE(request: NextRequest, context: Context) {
  return proxyRequest(request, context.params);
}
