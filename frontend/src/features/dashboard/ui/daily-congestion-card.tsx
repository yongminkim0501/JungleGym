"use client";

import Link from "next/link";

type DailyCongestionCardProps = {
  weeklyVisits: number[];
};

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export function DailyCongestionCard({ weeklyVisits }: DailyCongestionCardProps) {
  const counts = WEEKDAY_LABELS.map((_, index) => weeklyVisits[index] ?? 0);
  const busiestIndex = counts.reduce((busiest, count, index) => {
    return count > (counts[busiest] ?? 0) ? index : busiest;
  }, 0);
  const maxVisits = counts[busiestIndex] ?? 0;
  const chartMax = maxVisits > 0 ? maxVisits : 1;

  return (
    <section className="flex flex-1 flex-col rounded-xl border border-neutral-200 bg-white px-4 py-4">
      <Link
        href="/"
        className="group flex items-center gap-1 text-sm text-neutral-700"
      >
        요일별 방문 횟수
      </Link>
      <h3 className="text-lg font-semibold text-neutral-900">최근 방문 기록을 요일별로 비교해보세요.</h3>

      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {counts.map((count, index) => {
          const isBusiest = index === busiestIndex;
          const weekdayLabel = WEEKDAY_LABELS[index] ?? String(index + 1);

          return (
            <div className="flex min-w-0 flex-col items-center gap-2" key={weekdayLabel}>
              <span
                className={`text-[11px] font-medium ${
                  isBusiest ? "text-[#05D082]" : "text-neutral-400"
                }`}
              >
                {count}
              </span>
              <div className="flex h-24 w-full items-end justify-center rounded-lg bg-neutral-50 px-1.5 py-1.5">
                <span
                  className={`block w-full max-w-5 rounded-md ${
                    isBusiest ? "bg-[#05D082]" : "bg-neutral-200"
                  }`}
                  style={{ height: `${Math.round((count / chartMax) * 100)}%` }}
                />
              </div>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  isBusiest ? "bg-[#05D082] font-semibold text-white" : "text-neutral-500"
                }`}
              >
                {weekdayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
