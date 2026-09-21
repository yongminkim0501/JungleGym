import { dashboardQueryKey } from "./dashboard";
import { sessionQueryKey } from "./session";
import { visitsQueryKey } from "./visits";

export { dashboardQueryKey, dashboardQueryOptions } from "./dashboard";
export { sessionQueryKey, sessionQueryOptions } from "./session";
export { visitsQueryKey, visitsQueryOptions } from "./visits";

export const queryKeys = {
  session: sessionQueryKey,
  dashboard: dashboardQueryKey,
  visits: visitsQueryKey,
} as const;
