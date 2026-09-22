"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { AttendanceCalendar } from "@/entities";
import type { Dashboard } from "@/shared/api";
import { DashboardLayout, PhotoDialog, type PhotoDialogState } from "@/features/dashboard";

type DashboardScreenProps = {
  dashboard: Dashboard;
  attendanceCalendar: AttendanceCalendar;
  actions?: ReactNode;
};

export function DashboardScreen({ dashboard, attendanceCalendar, actions }: DashboardScreenProps) {
  const [photo, setPhoto] = useState<PhotoDialogState>(null);

  return (
    <>
      <DashboardLayout
        dashboard={dashboard}
        attendanceCalendar={attendanceCalendar}
        actions={actions}
        onPhotoSelect={setPhoto}
      />
      <PhotoDialog
        photo={photo}
        onOpenChange={(open) => {
          if (!open) {
            setPhoto(null);
          }
        }}
      />
    </>
  );
}
