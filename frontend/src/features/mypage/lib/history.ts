"use client";

import type { Visit } from "@/shared/api";

export type AccessHistoryRow = {
  key: string;
  kind: "check-in" | "check-out";
  at: string;
};

export function accessHistoryRows(visits: Visit[]): AccessHistoryRow[] {
  return visits.flatMap((visit) => {
    if (!visit.checkedOutAt) {
      return [
        {
          key: `${visit.id}-in`,
          kind: "check-in" as const,
          at: visit.checkedInAt,
        },
      ];
    }

    return [
      {
        key: `${visit.id}-out`,
        kind: "check-out" as const,
        at: visit.checkedOutAt,
      },
      {
        key: `${visit.id}-in`,
        kind: "check-in" as const,
        at: visit.checkedInAt,
      },
    ];
  });
}
