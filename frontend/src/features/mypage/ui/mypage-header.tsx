"use client";

import Link from "next/link";
import { Logo } from "@/shared/ui";
import { ArrowRightIcon } from "./icons";

type MypageHeaderProps = {
  title: string;
};

export function MypageHeader({ title }: MypageHeaderProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <Link
        href="/"
        className="group flex items-center gap-1 rounded text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/15 focus-visible:ring-offset-2"
      >
        메인으로 가기
        <ArrowRightIcon />
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <Logo className="h-[33px] w-[158px]" />
        <span className="text-neutral-900">{title}</span>
      </h1>
    </div>
  );
}
