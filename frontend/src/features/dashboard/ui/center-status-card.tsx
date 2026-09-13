"use client";

import type { Dashboard } from "@/shared/api";
import { centerStatus } from "../lib";

type CenterStatusCardProps = {
  dashboard: Dashboard;
};

export function CenterStatusCard({ dashboard }: CenterStatusCardProps) {
  const status = centerStatus(dashboard.currentVisitors);
  const occupancyPercent =
    dashboard.capacity > 0
      ? Math.min(
          Math.max((dashboard.currentVisitors / dashboard.capacity) * 100, 0),
          100,
        )
      : 0;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
            aria-hidden="true"
          >
            <img
              src={status.icon}
              width="48"
              height="48"
              className="h-12 w-12 object-contain drop-shadow-sm sm:h-14 sm:w-14"
              alt=""
            />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-neutral-900">
              현재{" "}
              <span className={status.textClass}>
                {dashboard.currentVisitors}명
              </span>
              이 운동하고 있어요.
            </h3>
            <p className={`text-sm font-semibold ${status.textClass}`}>
              {status.message}
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-end gap-1 text-neutral-900 sm:flex">
          <strong className={`text-4xl font-semibold ${status.textClass}`}>
            {dashboard.currentVisitors}
          </strong>
          <span className="pb-1 text-sm text-neutral-500">
            / {dashboard.capacity}명
          </span>
        </div>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100"
        role="progressbar"
        aria-label="피트니스 센터 이용 인원"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={dashboard.capacity > 0 ? occupancyPercent : undefined}
        aria-valuetext={
          dashboard.capacity > 0
            ? `정원 ${dashboard.capacity}명 중 ${dashboard.currentVisitors}명 이용 중`
            : `${dashboard.currentVisitors}명 이용 중`
        }
      >
        <div
          className={`h-full rounded-full ${status.barClass}`}
          style={{ width: `${occupancyPercent}%` }}
        />
      </div>
    </section>
  );
}
