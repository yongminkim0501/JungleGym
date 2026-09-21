"use client";

import { Avatar, ButtonLink } from "@/shared/ui";
import type { Dashboard } from "@/shared/api";
import { MypageHeader } from "./mypage-header";

type MyInfoViewProps = {
  dashboard: Dashboard;
};

export function MyInfoView({ dashboard }: MyInfoViewProps) {
  return (
    <section className="flex w-full flex-1 bg-neutral-50/50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <MypageHeader title="내 프로필" />

        <div className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white px-5 py-6">
          <Avatar
            name={dashboard.user.nickname}
            imageUrl={dashboard.user.profileImageUrl}
            className="h-20 w-20 text-2xl"
          />

          <strong className="mt-4 text-xl text-neutral-900">{dashboard.user.nickname}</strong>
          <span className="mt-1 text-sm text-neutral-500">{dashboard.user.email}</span>

          <div className="mt-6 grid w-full grid-cols-2 border-y border-neutral-100 py-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold text-[#05D082]">
                {dashboard.monthlyAttendance}일
              </span>
              <span className="text-xs text-neutral-500">이번 달 출석</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-neutral-100">
              <span className="text-xl font-semibold text-neutral-800">{dashboard.workoutCount}회</span>
              <span className="text-xs text-neutral-500">오운완 기록</span>
            </div>
          </div>

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
            <ButtonLink
              href="/"
              variant="secondary"
              size="plain"
              className="w-full rounded-xl px-4 py-3 text-neutral-700"
            >
              메인으로 가기
            </ButtonLink>
            <ButtonLink
              href="/mypage/history"
              variant="primary"
              size="plain"
              className="w-full rounded-xl px-4 py-3"
            >
              입 · 퇴실 기록 보기
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
