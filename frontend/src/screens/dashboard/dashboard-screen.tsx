"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/entities/dashboard";
import { DashboardLayout, PhotoDialog, type PhotoDialogState } from "@/features/dashboard";

type DashboardScreenProps = {
  actions?: ReactNode;
};

export function DashboardScreen({ actions }: DashboardScreenProps) {
  const { data: dashboard } = useSuspenseQuery(dashboardQueryOptions());
  const [photo, setPhoto] = useState<PhotoDialogState>(null);

  return (
    <>
      <DashboardLayout dashboard={dashboard} actions={actions} onPhotoSelect={setPhoto} />
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
