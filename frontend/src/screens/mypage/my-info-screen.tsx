"use client";

import { useSuspenseQueries } from "@tanstack/react-query";

import {
  attendanceCalendarQueryOptions,
  dashboardQueryOptions,
} from "@/entities";
import { MyInfoView } from "@/features/mypage";

export function MyInfoScreen() {
  const [{ data: dashboard }, { data: attendanceCalendar }] =
    useSuspenseQueries({
      queries: [dashboardQueryOptions(), attendanceCalendarQueryOptions()],
    });

  return (
    <MyInfoView
      dashboard={dashboard}
      monthlyAttendance={attendanceCalendar.monthlyAttendance}
    />
  );
}
