import { z } from "zod";

export const memberSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(50),
  nickname: z.string().trim().min(4).max(25),
  email: z.email(),
  jungleNumber: z.string(),
  status: z.enum(["active", "suspended"]),
  joinedAt: z.iso.datetime(),
  note: z.string().max(500),
  revision: z.number().int().nonnegative(),
});
export const eventLabels = {
  checkin: "입실",
  checkout: "퇴실",
  register: "회원가입",
  update: "정보 수정",
  suspend: "이용 정지",
  restore: "이용 재개",
} as const;
export type EventType = keyof typeof eventLabels;
const eventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(Object.keys(eventLabels) as [EventType, ...EventType[]]),
  at: z.iso.datetime(),
  result: z.enum(["success", "failed"]),
  detail: z.string(),
  actor: z.enum(["user", "admin", "system"]),
  actorName: z.string().optional(),
});
export const dataSchema = z.object({
  version: z.literal(1),
  generatedAt: z.iso.datetime(),
  users: z.array(memberSchema),
  events: z.array(eventSchema),
});
const endpointMetricSchema = z.object({
  method: z.string(),
  uri: z.string(),
  count: z.number(),
  meanMs: z.number().nullable(),
  p95Ms: z.number().nullable(),
  maxMs: z.number().nullable(),
  clientErrors: z.number(),
  serverErrors: z.number(),
});
const metricPointSchema = z.object({
  at: z.iso.datetime(),
  requests: z.number(),
  clientErrors: z.number(),
  serverErrors: z.number(),
  meanMs: z.number().nullable(),
  heapUsedMb: z.number(),
  dbActive: z.number().nullable(),
});
export const metricsSchema = z.object({
  generatedAt: z.iso.datetime(),
  startedAt: z.iso.datetime(),
  uptimeSeconds: z.number(),
  jvm: z.object({ heapUsedMb: z.number(), heapMaxMb: z.number() }),
  db: z.object({
    active: z.number().nullable(),
    idle: z.number().nullable(),
    pending: z.number().nullable(),
    max: z.number().nullable(),
  }),
  endpoints: z.array(endpointMetricSchema),
  history: z.array(metricPointSchema),
});
export type Member = z.infer<typeof memberSchema>;
export type Activity = z.infer<typeof eventSchema>;
export type AdminData = z.infer<typeof dataSchema>;
export type SystemMetrics = z.infer<typeof metricsSchema>;
export type EndpointMetric = z.infer<typeof endpointMetricSchema>;
export type MetricPoint = z.infer<typeof metricPointSchema>;

export function dateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function formatDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? ({ hour: "2-digit", minute: "2-digit", hour12: false } as const)
      : {}),
  }).format(new Date(value));
}
export function isInside(userId: string, activities: Activity[]) {
  const last = activities.find(
    (event) =>
      event.userId === userId &&
      event.result === "success" &&
      (event.type === "checkin" || event.type === "checkout"),
  );
  return last?.type === "checkin";
}
export function csvCell(value: string) {
  // Treat spreadsheet formulas as text, including values entered by an operator.
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function downloadCsv(name: string, rows: string[][]) {
  const blob = new Blob(
    ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
