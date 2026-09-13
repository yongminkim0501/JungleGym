import { queryOptions } from "@tanstack/react-query";

import { api } from "@/shared/api";

export const dashboardQueryKey = ["dashboard"] as const;

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKey,
    queryFn: ({ signal }) => api.dashboard({ signal }),
  });
}
