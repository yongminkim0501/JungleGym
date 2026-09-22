"use client";

const KST_TIME_ZONE = "Asia/Seoul";

export type CalendarCell = {
  day: number;
  key: string;
};

type KstDateParts = {
  year: number;
  month: number;
  day: number;
};

function kstDateParts(value: Date = new Date()): KstDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(value);

  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(byType.get("year")),
    month: Number(byType.get("month")),
    day: Number(byType.get("day")),
  };
}

export function kstUtcDate(value: Date = new Date()): Date {
  const { year, month, day } = kstDateParts(value);

  return new Date(Date.UTC(year, month - 1, day));
}

export function formatKstDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(value))
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export function formatKstTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatKstMonthDay(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function monthSundayCalendar(year: number, month: number): {
  cells: CalendarCell[];
} {
  const monthIndex = month - 1;
  const firstDay = new Date(0);
  firstDay.setUTCHours(0, 0, 0, 0);
  firstDay.setUTCFullYear(year, monthIndex, 1);
  const lastDay = new Date(0);
  lastDay.setUTCHours(0, 0, 0, 0);
  lastDay.setUTCFullYear(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getUTCDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDay.getUTCDay(); i += 1) {
    cells.push({ day: 0, key: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, key: `${year}-${month}-${day}` });
  }

  return { cells };
}
