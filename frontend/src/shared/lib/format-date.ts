const koreanDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Seoul",
});

const koreanTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

const koreanClockFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Seoul",
});

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatKoreanDate(value: string | Date): string {
  return koreanDateFormatter
    .format(toDate(value))
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export function formatKoreanTime(value: string | Date): string {
  return koreanTimeFormatter.format(toDate(value));
}

export function formatKoreanClock(value: string | Date = new Date()): string {
  return koreanClockFormatter.format(toDate(value));
}

export function formatMonthDay(month: number, day: number): string {
  return `${month}월 ${day}일`;
}
