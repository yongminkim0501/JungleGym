"use client";

import type { Visit } from "@/shared/api";

export type AccessHistoryRow = {
  key: string;
  kind: "check-in" | "check-out";
  at: string;
  autoCheckedOut: boolean;
  durationMinutes: number | null;
};

export function accessHistoryRows(visits: Visit[]): AccessHistoryRow[] {
  return visits.flatMap((visit) => {
    if (!visit.checkedOutAt) {
      return [
        {
          key: `${visit.id}-in`,
          kind: "check-in" as const,
          at: visit.checkedInAt,
          autoCheckedOut: false,
          durationMinutes: null,
        },
      ];
    }

    return [
      {
        key: `${visit.id}-out`,
        kind: "check-out" as const,
        at: visit.checkedOutAt,
        autoCheckedOut: visit.autoCheckedOut,
        durationMinutes: visit.autoCheckedOut
          ? 59
          : (visit.durationMinutes ??
            Math.max(
              0,
              Math.floor(
                (Date.parse(visit.checkedOutAt) -
                  Date.parse(visit.checkedInAt)) /
                  60_000,
              ),
            )),
      },
      {
        key: `${visit.id}-in`,
        kind: "check-in" as const,
        at: visit.checkedInAt,
        autoCheckedOut: false,
        durationMinutes: null,
      },
    ];
  });
}
