import { queryOptions } from "@tanstack/react-query";

import { api } from "@/shared/api";
import type { VisitDto, VisitHistory } from "@/shared/api";

export const visitsQueryKey = ["visits"] as const;

function toVisitHistory(firstPage: { content: VisitDto[]; page: number; totalPages: number; totalElements: number }): VisitHistory {
  return {
    visits: firstPage.content,
    page: firstPage.page,
    totalPages: firstPage.totalPages,
    totalElements: firstPage.totalElements,
  };
}

async function fetchAllVisits(signal?: AbortSignal): Promise<VisitHistory> {
  const size = 100;
  const firstPage = await api.visits(signal ? { page: 0, size, signal } : { page: 0, size });

  if (firstPage.totalPages <= 1) {
    return toVisitHistory(firstPage);
  }

  const content: VisitDto[] = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await api.visits(signal ? { page, size, signal } : { page, size });
    content.push(...nextPage.content);
  }

  return {
    visits: content,
    page: 0,
    totalPages: firstPage.totalPages,
    totalElements: firstPage.totalElements,
  };
}

export function visitsQueryOptions() {
  return queryOptions({
    queryKey: visitsQueryKey,
    queryFn: ({ signal }) => fetchAllVisits(signal),
  });
}
