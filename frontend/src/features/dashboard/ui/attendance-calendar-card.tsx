"use client";

import type { Dashboard, Workout } from "@/shared/api";
import { optimizedBackgroundImage } from "@/shared/lib";
import { currentMonthSundayCalendar, formatKstMonthDay } from "../lib";
import { CheckIcon, ImageIcon, NoteIcon } from "./icons";
import type { PhotoDialogState } from "./photo-dialog";

type AttendanceCalendarCardProps = {
  dashboard: Dashboard;
  onPhotoSelect: (photo: NonNullable<PhotoDialogState>) => void;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// The source artwork is 16,384px wide; calendar cells only need a small rendition.
const STREAK_BACKGROUND = optimizedBackgroundImage({
  src: "/image/icon/mesh_gradient.png",
  width: 384,
  height: 232,
});

function eventForDay(events: Record<string, Workout>, day: number): Workout | undefined {
  return events[String(day)];
}

function visualStreakDays(attendanceDays: number[], streakDays: number): Set<number> {
  if (streakDays <= 0) {
    return new Set();
  }

  const attendedDays = new Set(attendanceDays);
  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    day: "numeric",
  }).format(new Date());
  const todayDay = Number(today);
  const endDay = attendedDays.has(todayDay)
    ? todayDay
    : attendedDays.has(todayDay - 1)
      ? todayDay - 1
      : null;

  if (endDay === null) {
    return new Set();
  }

  const visualDays = new Set<number>();
  for (let day = endDay; day > 0 && visualDays.size < streakDays; day -= 1) {
    if (!attendedDays.has(day)) {
      break;
    }
    visualDays.add(day);
  }

  return visualDays;
}

export function AttendanceCalendarCard({ dashboard, onPhotoSelect }: AttendanceCalendarCardProps) {
  const { month, cells } = currentMonthSundayCalendar();
  const attendedDays = new Set(dashboard.attendanceDays);
  const streakVisualDays = visualStreakDays(dashboard.attendanceDays, dashboard.streakDays);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-3 py-4 sm:px-4">
      <div className="flex flex-col gap-1">
        <div>
          {dashboard.streakDays > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7CC1EB]/25 via-[#9DA7E7]/25 to-[#BEA0EB]/25 px-1.5 py-1 text-xs">
              <img
                src="/image/icon/star.webp"
                width="16"
                height="16"
                className="h-4 w-4 object-contain"
                alt=""
              />

              <span className="bg-gradient-to-r from-blue-500/70 to-fuchsia-400/80 bg-clip-text pr-1 text-sm font-semibold text-transparent md:text-xs">
                {dashboard.streakDays}일째 연속 오운완
              </span>
            </span>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 sm:text-xl">출석 체크 캘린더</h3>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg sm:mt-5 sm:rounded-xl">
        <div className="grid grid-cols-7 text-center text-[11px] text-neutral-400 sm:text-right sm:text-xs">
          {WEEKDAY_LABELS.map((weekday, index) => (
            <span
              className={`border-b border-neutral-200 px-1 py-2 sm:px-3 ${
                index !== WEEKDAY_LABELS.length - 1 ? "border-r" : ""
              } ${index === 0 ? "text-red-400" : ""} ${
                index === WEEKDAY_LABELS.length - 1 ? "text-blue-400" : ""
              }`}
              key={weekday}
            >
              {weekday}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            const column = index % 7;
            const isLastRow = index >= cells.length - 7;

            if (cell.day === 0) {
              return (
                <span
                  className={`min-h-14 border-neutral-200 sm:min-h-26 ${
                    column !== 6 ? "border-r" : ""
                  } ${!isLastRow ? "border-b" : ""}`}
                  key={cell.key}
                />
              );
            }

            const isAttended = attendedDays.has(cell.day);
            const isStreak = streakVisualDays.has(cell.day);
            const event = eventForDay(dashboard.workoutEvents, cell.day);
            const memo = event?.title?.trim() ?? "";
            const photoUrl = event?.imageUrl?.trim() ?? "";
            const photoDate = event?.checkedInAt ? formatKstMonthDay(event.checkedInAt) : `${month}월 ${cell.day}일`;

            return (
              <div
                className={`min-h-14 min-w-0 border-neutral-200 pt-0.5 md:min-h-20 sm:pt-1 ${
                  column !== 6 ? "border-r" : ""
                } ${!isLastRow ? "border-b" : ""} ${isAttended && !isStreak ? "bg-neutral-100/80" : ""}`}
                key={cell.key}
                style={
                  isStreak
                    ? {
                        backgroundImage: STREAK_BACKGROUND,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }
                    : undefined
                }
              >
                <span
                  className={`flex justify-end px-1 pb-0 pt-1 text-xs sm:px-3 sm:text-sm ${
                    isAttended && !isStreak ? "font-semibold text-neutral-800" : !isStreak ? "text-neutral-400" : ""
                  }`}
                >
                  {isStreak ? (
                    <span className="inline-flex items-center justify-end gap-0 sm:-gap-1">
                      <img
                        src="/image/icon/star.webp"
                        width="12"
                        height="12"
                        className="h-2.5 w-2.5 object-contain sm:h-3 sm:w-3"
                        alt=""
                      />
                      <span className="inline-flex w-full items-center justify-end bg-gradient-to-r from-blue-400 to-fuchsia-300 bg-clip-text font-semibold text-transparent">
                        {cell.day}
                      </span>
                    </span>
                  ) : isAttended ? (
                    <span className="inline-flex items-center justify-end gap-0.5">
                      <CheckIcon className="h-2.5 w-2.5 text-[#05D082] sm:h-3.5 sm:w-3.5" />
                      <span>{cell.day}</span>
                    </span>
                  ) : (
                    cell.day
                  )}
                </span>

                {photoUrl ? (
                  <button
                    type="button"
                    className="jg-pressable mx-0.5 mt-1 flex w-[calc(100%_-_0.25rem)] min-w-0 items-center justify-center gap-1 rounded bg-neutral-800/95 px-1 py-1 text-white outline-none focus-visible:ring-2 focus-visible:ring-neutral-800/20 focus-visible:ring-offset-2 sm:mx-1 sm:mt-1.5 sm:max-w-[calc(100%_-_0.5rem)] sm:justify-start sm:rounded-md sm:px-1.5"
                    title={memo || "오운완 사진 보기"}
                    onClick={() => onPhotoSelect({ url: photoUrl, memo, date: photoDate })}
                  >
                    <ImageIcon className="hidden shrink-0 text-[#7CC1EB] sm:block" />
                    <span className="max-w-full min-w-0 truncate text-left text-[9px] font-medium leading-none sm:flex-1 sm:text-[10px]">
                      {memo || "오운완"}
                    </span>
                  </button>
                ) : memo ? (
                  <div
                    className="mx-0.5 mt-1 flex w-[calc(100%_-_0.25rem)] min-w-0 items-center justify-center gap-1 rounded bg-neutral-800/95 px-1 py-1 text-white sm:mx-1 sm:mt-1.5 sm:max-w-[calc(100%_-_0.5rem)] sm:justify-start sm:rounded-md sm:px-1.5"
                    title={memo}
                  >
                    <NoteIcon className="hidden shrink-0 text-[#BEA0EB] sm:block" />
                    <span className="max-w-full min-w-0 truncate text-[9px] font-medium leading-none sm:flex-1 sm:text-[10px]">
                      {memo}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 sm:mt-4 sm:gap-x-4 sm:pt-4 sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#05D082]/20" />
          출석
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-6 rounded-sm bg-gradient-to-r from-[#7CC1EB]/20 via-[#9DA7E7]/20 to-[#BEA0EB]/20" />
          연속 출석
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-neutral-800/95" />
          오운완 기록
        </span>
      </div>
    </section>
  );
}
