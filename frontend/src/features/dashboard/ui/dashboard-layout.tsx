"use client";

import type { ReactNode } from "react";
import type { AttendanceCalendar } from "@/entities";
import type { Dashboard } from "@/shared/api";
import { AttendanceCalendarCard } from "./attendance-calendar-card";
import { CenterStatusCard } from "./center-status-card";
import { DailyCongestionCard } from "./daily-congestion-card";
import { DashboardHeader } from "./dashboard-header";
import { ProfileCard } from "./profile-card";
import { RecentWorkoutCard } from "./recent-workout-card";
import type { PhotoDialogState } from "./photo-dialog";

type DashboardLayoutProps = {
  dashboard: Dashboard;
  attendanceCalendar: AttendanceCalendar;
  actions?: ReactNode;
  onPhotoSelect: (photo: NonNullable<PhotoDialogState>) => void;
};

export function DashboardLayout({ dashboard, attendanceCalendar, actions, onPhotoSelect }: DashboardLayoutProps) {
  return (
    <section className="flex w-full flex-1 bg-neutral-50/50 px-4 pb-32 pt-6 md:px-6 md:py-8">
      <div className="mx-auto grid w-full max-w-8xl gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="contents lg:order-1 lg:flex lg:flex-col lg:gap-4">
          <ProfileCard
            dashboard={dashboard}
            monthlyAttendance={attendanceCalendar.monthlyAttendance}
          />
          <RecentWorkoutCard workout={dashboard.recentWorkout} />
        </aside>

        <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-2">
          <DashboardHeader checkedIn={dashboard.checkedIn} />
          <CenterStatusCard dashboard={dashboard} />

          <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.75fr)]">
            <AttendanceCalendarCard
              calendar={attendanceCalendar}
              onPhotoSelect={onPhotoSelect}
            />

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5">
                {actions}
                <DailyCongestionCard weeklyVisits={dashboard.weeklyVisits} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
