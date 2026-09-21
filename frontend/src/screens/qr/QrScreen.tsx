"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { dashboardQueryOptions } from "@/entities";
import { GymActions } from "@/features/gym";
import { Logo } from "@/shared/ui";

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function QrScreen() {
  const { data: dashboard } = useSuspenseQuery(dashboardQueryOptions());

  return (
    <section className="flex w-full flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Link
          href="/"
          className="group flex items-center gap-1 text-neutral-700 hover:text-neutral-800"
        >
          메인으로 가기
          <ArrowRightIcon />
        </Link>

        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Logo className="h-[33px] w-[158px]" />
          <span className="text-neutral-900">입 · 퇴실</span>
        </h1>

        <div className="flex w-full flex-col gap-5 py-4">
          <GymActions checkedIn={dashboard.checkedIn} />
        </div>
      </div>
    </section>
  );
}
