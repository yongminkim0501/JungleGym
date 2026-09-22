import type {
  AttendanceCalendarDayDto,
  AttendanceDayDto,
} from "@/shared/api";
import { ApiError } from "@/shared/api";

export type KoreanDate = {
  year: number;
  month: number;
  day: number;
};

export type AttendanceCalendarDay = {
  day: number;
  attended: boolean;
  title: string;
  imageUrl: string;
};

export type AttendanceCalendar = {
  year: number;
  month: number;
  days: AttendanceCalendarDay[];
  monthlyAttendance: number;
  recentStreakDays: number;
  streakDayNumbers: number[];
};

type AttendanceLoader = (
  year: number,
  month: number,
) => Promise<AttendanceDayDto[]>;

function invalidCalendarResponse(): never {
  throw new ApiError({
    status: 502,
    message: "월별 출석 달력 응답 형식이 올바르지 않습니다.",
  });
}

export function koreanDateParts(value: Date = new Date()): KoreanDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
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

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function previousDate(date: KoreanDate): KoreanDate | null {
  if (date.day > 1) {
    return { ...date, day: date.day - 1 };
  }

  if (date.year === 1 && date.month === 1) {
    return null;
  }

  const month = date.month === 1 ? 12 : date.month - 1;
  const year = date.month === 1 ? date.year - 1 : date.year;

  return { year, month, day: daysInMonth(year, month) };
}

function validateCalendarDays(
  year: number,
  month: number,
  days: AttendanceCalendarDayDto[],
) {
  const expectedDays = daysInMonth(year, month);
  if (days.length !== expectedDays) {
    invalidCalendarResponse();
  }

  days.forEach((item, index) => {
    if (item.date !== index + 1) {
      invalidCalendarResponse();
    }
    if (!item.ischeck && (item.title !== "" || item.img_url !== "")) {
      invalidCalendarResponse();
    }
  });
}

function attendanceSet(
  year: number,
  month: number,
  days: AttendanceDayDto[],
): Set<number> {
  const maxDay = daysInMonth(year, month);
  let previousDay = 0;

  for (const item of days) {
    if (item.date <= previousDay || item.date > maxDay) {
      invalidCalendarResponse();
    }
    previousDay = item.date;
  }

  return new Set(days.map((item) => item.date));
}

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

async function recentStreak(
  today: KoreanDate,
  currentDays: AttendanceCalendarDayDto[],
  loadAttendance: AttendanceLoader,
) {
  const cache = new Map<string, Set<number>>([
    [
      monthKey(today.year, today.month),
      new Set(
        currentDays.filter((item) => item.ischeck).map((item) => item.date),
      ),
    ],
  ]);

  async function attended(date: KoreanDate) {
    const key = monthKey(date.year, date.month);
    let days = cache.get(key);

    if (!days) {
      days = attendanceSet(
        date.year,
        date.month,
        await loadAttendance(date.year, date.month),
      );
      cache.set(key, days);
    }

    return days.has(date.day);
  }

  let cursor: KoreanDate | null = today;
  if (!(await attended(cursor))) {
    cursor = previousDate(cursor);
  }
  if (!cursor || !(await attended(cursor))) {
    return { count: 0, dayNumbers: [] as number[] };
  }

  let count = 0;
  const dayNumbers: number[] = [];
  while (cursor && (await attended(cursor))) {
    count += 1;
    if (cursor.year === today.year && cursor.month === today.month) {
      dayNumbers.push(cursor.day);
    }
    cursor = previousDate(cursor);
  }

  return { count, dayNumbers };
}

export async function createAttendanceCalendar(
  today: KoreanDate,
  source: AttendanceCalendarDayDto[],
  loadAttendance: AttendanceLoader,
): Promise<AttendanceCalendar> {
  validateCalendarDays(today.year, today.month, source);
  const streak = await recentStreak(today, source, loadAttendance);
  const days = source.map((item) => ({
    day: item.date,
    attended: item.ischeck,
    title: item.title,
    imageUrl: item.img_url,
  }));

  return {
    year: today.year,
    month: today.month,
    days,
    monthlyAttendance: days.filter((item) => item.attended).length,
    recentStreakDays: streak.count,
    streakDayNumbers: streak.dayNumbers,
  };
}
