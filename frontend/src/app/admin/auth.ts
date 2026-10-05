import "server-only";
import { cookies } from "next/headers";
import { backendOrigin } from "@/shared/api/server";
import { z } from "zod";

const sessionSchema = z.object({
  success: z.literal(true),
  data: z.object({ id: z.number().int().min(1).max(2), name: z.string() }),
});

export async function getAdminSession() {
  const session = (await cookies()).get("junglegym-admin-session")?.value;
  if (!session) return null;
  const origin = backendOrigin();
  if (!origin) throw new Error("Spring API 주소를 설정해 주세요.");
  const response = await fetch(`${origin}/api/admin/auth/me`, {
    headers: { Cookie: `junglegym-admin-session=${encodeURIComponent(session)}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("관리자 인증 서버에 연결할 수 없습니다.");
  return sessionSchema.parse(await response.json()).data;
}
