import { queryOptions } from "@tanstack/react-query";

import { api, ApiError } from "@/shared/api";

export const sessionQueryKey = ["session"] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionQueryKey,
    queryFn: async ({ signal }) => {
      try {
        return await api.me({ signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }

        throw error;
      }
    },
  });
}
