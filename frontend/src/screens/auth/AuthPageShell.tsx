"use client";

import { PropsWithChildren } from "react";
import { Logo } from "@/shared/ui";

type AuthPageShellProps = PropsWithChildren<{
  title: string;
}>;

export function AuthPageShell({ children, title }: AuthPageShellProps) {
  return (
    <section className="flex w-full flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-xs flex-col gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Logo className="h-[33px] w-[158px]" />
          <span className="text-neutral-900">{title}</span>
        </h1>
        {children}
      </div>
    </section>
  );
}
