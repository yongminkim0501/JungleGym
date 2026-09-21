"use client";

import Link from "next/link";
import { Avatar, ButtonLink } from "@/shared/ui";
import type { Dashboard } from "@/shared/api";
import { ArrowRightIcon } from "./icons";

type ProfileCardProps = {
  dashboard: Dashboard;
};

export function ProfileCard({ dashboard }: ProfileCardProps) {
  return (
    <>
      <div className="order-3 flex w-full max-w-xs flex-col gap-1 lg:order-none">
        <Link
          href="/mypage/info"
          className="group flex items-center gap-1 rounded text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:ring-offset-2"
        >
          오운완 프로필
          <ArrowRightIcon />
        </Link>

        <h1 className="flex flex-col items-start gap-2 text-2xl font-semibold">
          <span className="text-neutral-900">내 프로필</span>
        </h1>
      </div>

      <div className="order-3 flex flex-col items-center rounded-xl border border-neutral-200 bg-white px-4 py-4 lg:order-none">
        <Avatar
          name={dashboard.user.nickname}
          imageUrl={dashboard.user.profileImageUrl}
          className="h-20 w-20 text-2xl"
        />
        <span className="mt-2 text-xl font-semibold text-neutral-900">
          {dashboard.user.nickname}
        </span>
        <span className="text-sm text-neutral-500">{dashboard.user.email}</span>

        <div className="mt-3 grid w-full grid-cols-2 gap-2 border-y border-neutral-100 py-4 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold text-[#05D082]">
              {dashboard.monthlyAttendance}일
            </span>
            <span className="text-xs text-neutral-500">이번 달 출석</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-neutral-100">
            <span className="text-xl font-semibold text-neutral-800">
              {dashboard.workoutCount}회
            </span>
            <span className="text-xs text-neutral-500">오운완 기록</span>
          </div>
        </div>

        <ButtonLink
          href="/mypage/info"
          variant="secondary"
          size="plain"
          className="mt-4 w-full rounded-xl px-4 py-3 text-sm md:py-2"
        >
          내 프로필 보기
        </ButtonLink>
      </div>
    </>
  );
}
