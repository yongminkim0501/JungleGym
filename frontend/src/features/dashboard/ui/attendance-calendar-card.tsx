"use client";

import type { AttendanceCalendar } from "@/entities";
import { formatMonthDay, optimizedBackgroundImage } from "@/shared/lib";
import { monthSundayCalendar } from "../lib";
import { CheckIcon, ImageIcon, NoteIcon } from "./icons";
import type { PhotoDialogState } from "./photo-dialog";

type AttendanceCalendarCardProps = {
  calendar: AttendanceCalendar;
  onPhotoSelect: (photo: NonNullable<PhotoDialogState>) => void;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// The source artwork is 16,384px wide; calendar cells only need a small rendition.
const STREAK_BACKGROUND = optimizedBackgroundImage({
  src: "/image/icon/mesh_gradient.png",
  width: 384,
  height: 232,
});

export function AttendanceCalendarCard({ calendar, onPhotoSelect }: AttendanceCalendarCardProps) {
  const { cells } = monthSundayCalendar(calendar.year, calendar.month);
  const days = new Map(calendar.days.map((day) => [day.day, day]));
  const streakVisualDays = new Set(calendar.streakDayNumbers);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-3 py-4 sm:px-4">
      <div className="flex flex-col gap-1">
        <div>
          {calendar.recentStreakDays > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7CC1EB]/25 via-[#9DA7E7]/25 to-[#BEA0EB]/25 px-1.5 py-1 text-xs">
              <img
                src="/image/icon/star.webp"
                width="16"
                height="16"
                className="h-4 w-4 object-contain"
                alt=""
              />

              <span className="bg-gradient-to-r from-blue-500/70 to-fuchsia-400/80 bg-clip-text pr-1 text-sm font-semibold text-transparent md:text-xs">
                {calendar.recentStreakDays}일째 연속 오운완
              </span>
            </span>
          ) : null}
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold text-neutral-900 sm:text-xl">출석 체크 캘린더</h3>
          <span className="shrink-0 text-xs font-medium text-neutral-500 sm:text-sm">
            {calendar.year}년 {calendar.month}월
          </span>
        </div>
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

            const day = days.get(cell.day);
            const isAttended = day?.attended === true;
            const isStreak = streakVisualDays.has(cell.day);
            const memo = day?.title.trim() ?? "";
            const photoUrl = day?.imageUrl.trim() ?? "";
            const photoDate = formatMonthDay(calendar.month, cell.day);

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
