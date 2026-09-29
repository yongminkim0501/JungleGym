import { z } from "zod";

export const memberSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(50),
  nickname: z.string().trim().min(1).max(25),
  email: z.email(),
  jungleNumber: z.string(),
  status: z.enum(["active", "suspended"]),
  joinedAt: z.iso.datetime(),
  note: z.string().max(500),
});
export const eventLabels = {
  login: "로그인",
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
  actor: z.enum(["user", "admin"]),
});
export const dataSchema = z.object({
  version: z.literal(1),
  users: z.array(memberSchema),
  events: z.array(eventSchema),
});
export type Member = z.infer<typeof memberSchema>;
export type Activity = z.infer<typeof eventSchema>;
export type AdminData = z.infer<typeof dataSchema>;

export const sampleDay = "2026-09-29";
const names = [
  "김민준",
  "이서연",
  "박지훈",
  "최유진",
  "정도현",
  "강하은",
  "윤서준",
  "장지우",
  "임수빈",
  "한지민",
  "오현우",
  "신예린",
  "서준호",
  "권민서",
  "황도윤",
  "안서현",
  "송지호",
  "류하린",
];
const nicknames = [
  "꾸준한러너",
  "오늘도한세트",
  "정글피트",
  "유진의루틴",
  "데드리프트",
  "초록덤벨",
  "모닝짐",
  "지우의운동장",
  "수빈로그",
  "한걸음씩",
  "가벼운시작",
  "예린핏",
  "준호의기록",
  "오운완민서",
  "도윤러닝",
  "서현스쿼트",
  "운동하는지호",
  "하린의루틴",
];
const users: Member[] = names.map((name, index) => ({
  id: `JG-${String(index + 1).padStart(4, "0")}`,
  name,
  nickname: nicknames[index]!,
  email: `member${String(index + 1).padStart(2, "0")}@example.com`,
  jungleNumber: `${(index % 3) + 9}기`,
  status: index === 5 || index === 12 ? "suspended" : "active",
  joinedAt: `2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
  note: "",
}));
const events: Activity[] = [];
users.forEach((user, index) => {
  events.push({
    id: `register-${index}`,
    userId: user.id,
    type: "register",
    at: user.joinedAt,
    result: "success",
    detail: "이메일로 회원가입",
    actor: "user",
  });
  if (user.status === "suspended") {
    events.push({
      id: `suspend-${index}`,
      userId: user.id,
      type: "suspend",
      at: "2026-09-22T08:00:00.000Z",
      result: "success",
      detail: "관리자 검토로 이용 정지",
      actor: "admin",
    });
    return;
  }
  for (let day = 23; day <= 29; day++) {
    if ((index + day) % 3 === 0) continue;
    const at = (hour: number, minute: number) =>
      `2026-09-${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
    events.push({
      id: `login-${index}-${day}`,
      userId: user.id,
      type: "login",
      at: at(index % 5, 5),
      result: "success",
      detail: "이메일 로그인",
      actor: "user",
    });
    events.push({
      id: `in-${index}-${day}`,
      userId: user.id,
      type: "checkin",
      at: at(index % 5, 10),
      result: "success",
      detail: "QR 입실 · 정글짐",
      actor: "user",
    });
    if (day < 29 || index % 4 !== 0)
      events.push({
        id: `out-${index}-${day}`,
        userId: user.id,
        type: "checkout",
        at: at((index % 5) + 1, 20),
        result: "success",
        detail: "운동 기록 저장 후 퇴실",
        actor: "user",
      });
  }
});
events.push({
  id: "failed-login",
  userId: users[2]!.id,
  type: "login",
  at: "2026-09-29T06:42:00.000Z",
  result: "failed",
  detail: "로그인 실패 · 비밀번호 불일치",
  actor: "user",
});
export const initialData: AdminData = {
  version: 1,
  users,
  events: events.sort((a, b) => b.at.localeCompare(a.at)),
};

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
