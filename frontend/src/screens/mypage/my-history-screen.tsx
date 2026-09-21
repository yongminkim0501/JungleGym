"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { visitsQueryOptions } from "@/entities/visits";
import { MyHistoryView } from "@/features/mypage";

export function MyHistoryScreen() {
  const { data: history } = useSuspenseQuery(visitsQueryOptions());

  return <MyHistoryView visits={history.visits} />;
}
