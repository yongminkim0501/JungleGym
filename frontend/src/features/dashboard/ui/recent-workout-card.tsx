"use client";

import Link from "next/link";
import type { Workout } from "@/shared/api";
import { ArrowRightIcon } from "./icons";

type RecentWorkoutCardProps = {
  workout: Workout | null;
};

export function RecentWorkoutCard({ workout }: RecentWorkoutCardProps) {
  const imageUrl = workout?.imageUrl?.trim();

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className="order-1 flex h-[200px] flex-col items-start rounded-xl bg-cover bg-center px-4 py-4 lg:order-none"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent), url('${imageUrl}')`,
      }}
    >
      <Link
        href="/mypage/history"
        className="group flex items-center gap-1 rounded text-sm text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
      >
        최근 오운완 기록
        <ArrowRightIcon />
      </Link>

      <h2 className="flex flex-col items-start gap-2 text-lg font-semibold">
        <span className="text-neutral-50">나의 변화를 확인해보세요.</span>
      </h2>
    </div>
  );
}
