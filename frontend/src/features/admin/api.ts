import { z } from "zod";
import { ApiError } from "@/shared/api";
import { dataSchema, memberSchema, metricsSchema, type Member } from "./model";

async function request<T>(path: string, schema: z.ZodType<T>, method = "GET", body?: unknown): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (method !== "GET") {
    const csrf = await request("/auth/csrf", z.string());
    headers.set("X-ADMIN-CSRF", csrf);
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`/api/admin${path}`, {
      method, headers, cache: "no-store", credentials: "same-origin",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw new ApiError({ status: 503, message: "관리자 서버에 연결할 수 없습니다. 다시 시도해 주세요." }); }
  const result = await response.json().catch(() => null);
  const requestId = typeof result?.requestId === "string" ? result.requestId : response.headers.get("x-request-id");
  if (!response.ok) throw new ApiError({ status: response.status,
    message: typeof result?.message === "string" ? result.message : "요청 처리에 실패했습니다.",
    ...(requestId && { requestId }) });
  return z.object({ success: z.literal(true), data: schema }).parse(result).data;
}

export const adminApi = {
  login: (token: string) => request("/auth/login", z.object({ id: z.number(), name: z.string() }), "POST", { token }),
  logout: () => request("/auth/logout", z.null(), "POST"),
  data: () => request("/data", dataSchema),
  metrics: () => request("/metrics", metricsSchema),
  update: (member: Member) => request(`/users/${member.id}`, memberSchema, "PATCH", {
    name: member.name, nickname: member.nickname, email: member.email,
    status: member.status, note: member.note, revision: member.revision,
  }),
};
