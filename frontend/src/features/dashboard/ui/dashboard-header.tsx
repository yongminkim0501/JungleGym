"use client";

import Link from "next/link";
import { Logo } from "@/shared/ui";
import { ArrowRightIcon } from "./icons";

type DashboardHeaderProps = {
  checkedIn: boolean;
};

export function DashboardHeader({ checkedIn }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex w-full max-w-xs flex-col gap-1">
        <Link
          href="/"
          className="group flex items-center gap-1 rounded text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:ring-offset-2"
        >
          메인
          <ArrowRightIcon />
        </Link>

        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Logo className="h-[33px] w-[158px]" />
          <span className="text-neutral-900">피트니스 센터</span>
        </h1>
      </div>

      <span
        role="status"
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
          checkedIn ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${checkedIn ? "bg-[#05D082]" : "bg-neutral-400"}`}
          aria-hidden="true"
        />
        {checkedIn ? "입실 중" : "미입실"}
      </span>
    </div>
  );
}
