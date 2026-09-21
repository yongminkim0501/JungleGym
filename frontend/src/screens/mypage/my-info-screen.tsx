"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { dashboardQueryOptions } from "@/entities/dashboard";
import { MyInfoView } from "@/features/mypage";

export function MyInfoScreen() {
  const { data: dashboard } = useSuspenseQuery(dashboardQueryOptions());

  return <MyInfoView dashboard={dashboard} />;
}
