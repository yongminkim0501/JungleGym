import { queryOptions } from "@tanstack/react-query";

import { api } from "@/shared/api";
import { createAttendanceCalendar, koreanDateParts } from "./model";

export const attendanceCalendarQueryKey = ["attendance-calendar"] as const;

export function attendanceCalendarQueryOptions(now: Date = new Date()) {
  const today = koreanDateParts(now);

  return queryOptions({
    queryKey: [
      ...attendanceCalendarQueryKey,
      today.year,
      today.month,
      today.day,
    ],
    queryFn: async ({ signal }) => {
      const source = await api.attendanceCalendar(
        { year: today.year, month: today.month },
        { signal },
      );

      return createAttendanceCalendar(today, source, (year, month) =>
        api.attendanceDays({ year, month }, { signal }),
      );
    },
  });
}
