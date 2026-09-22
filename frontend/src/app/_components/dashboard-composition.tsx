"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import Link from "next/link";
import {
  attendanceCalendarQueryOptions,
  dashboardQueryOptions,
} from "@/entities";
import { DashboardScreen } from "@/screens/dashboard";
import { GymActions } from "@/features/gym";

export function DashboardComposition() {
  const [{ data: dashboard }, { data: attendanceCalendar }] =
    useSuspenseQueries({
      queries: [dashboardQueryOptions(), attendanceCalendarQueryOptions()],
    });
  return (
    <DashboardScreen
      dashboard={dashboard}
      attendanceCalendar={attendanceCalendar}
      actions={
        <section className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:static md:z-auto md:rounded-xl md:border md:px-4 md:py-4 md:shadow-none">
          <Link
            href="/qr"
            className="hidden items-center gap-1 text-sm text-neutral-700 hover:text-neutral-800 md:flex"
          >
            입 · 퇴실
          </Link>
          <h3 className="hidden text-lg font-semibold text-neutral-900 md:block">
            운동을 시작하거나 마쳐보세요.
          </h3>
          <GymActions checkedIn={dashboard.checkedIn} compact className="md:mt-4" />
        </section>
      }
    />
  );
}
