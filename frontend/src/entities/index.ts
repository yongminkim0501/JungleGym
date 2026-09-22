import { attendanceCalendarQueryKey } from "./attendance-calendar";
import { dashboardQueryKey } from "./dashboard";
import { sessionQueryKey } from "./session";
import { visitsQueryKey } from "./visits";

export {
  attendanceCalendarQueryKey,
  attendanceCalendarQueryOptions,
  createAttendanceCalendar,
  daysInMonth,
  koreanDateParts,
  type AttendanceCalendar,
  type AttendanceCalendarDay,
  type KoreanDate,
} from "./attendance-calendar";
export { dashboardQueryKey, dashboardQueryOptions } from "./dashboard";
export { sessionQueryKey, sessionQueryOptions } from "./session";
export { visitsQueryKey, visitsQueryOptions } from "./visits";

export const queryKeys = {
  attendanceCalendar: attendanceCalendarQueryKey,
  session: sessionQueryKey,
  dashboard: dashboardQueryKey,
  visits: visitsQueryKey,
} as const;
