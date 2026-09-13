"use client";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { useGymWorkflowStore } from "./store";

type GymActionsProps = {
  checkedIn: boolean;
  className?: string;
  compact?: boolean;
};

export function GymActions({ checkedIn, className, compact = false }: GymActionsProps) {
  const openCheckIn = useGymWorkflowStore((state) => state.openCheckIn);
  const openCheckOut = useGymWorkflowStore((state) => state.openCheckOut);
  const pending = useGymWorkflowStore((state) => state.pending);

  return (
    <div
      className={cn(
        "flex w-full items-stretch justify-center gap-2",
        compact && "gap-1.5",
        className,
      )}
    >
      <Button
        id="open-check-in-btn"
        type="button"
        size="plain"
        variant="secondary"
        className={cn(
          "flex w-full flex-col items-center justify-center gap-0 rounded-xl bg-neutral-100 px-4 text-center text-neutral-800 hover:bg-neutral-200/80 disabled:opacity-50",
          compact ? "py-3 md:py-8" : "py-12",
        )}
        disabled={checkedIn || pending}
        aria-disabled={checkedIn || pending}
        title={checkedIn ? "이미 입실 중입니다." : undefined}
        onClick={openCheckIn}
      >
        <span className="text-lg font-semibold text-neutral-800">입실</span>
        <span className={cn("mt-1 text-xs text-neutral-500", compact && "hidden md:inline")}>
          {checkedIn ? "현재 입실 중" : "운동 시작"}
        </span>
      </Button>

      <Button
        id="open-check-out-btn"
        type="button"
        size="plain"
        variant="danger"
        className={cn(
          "flex w-full flex-col items-center justify-center gap-0 rounded-xl bg-red-500 px-4 text-center text-white hover:bg-red-500/80 disabled:opacity-50",
          compact ? "py-3 md:py-8" : "py-12",
        )}
        disabled={!checkedIn || pending}
        aria-disabled={!checkedIn || pending}
        title={!checkedIn ? "현재 입실 상태가 아닙니다." : undefined}
        onClick={openCheckOut}
      >
        <span className="text-lg font-semibold text-white">퇴실</span>
        <span className={cn("mt-1 text-xs text-red-100", compact && "hidden md:inline")}>
          {checkedIn ? "오운완 기록" : "입실 후 이용 가능"}
        </span>
      </Button>
    </div>
  );
}
