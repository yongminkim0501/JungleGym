"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Logo, Skeleton } from "@/shared/ui";
import { QueryBoundary } from "@/shared/query";

const Navigation = dynamic(
  () => import("@/features/navigation").then((module) => module.Navigation),
  { ssr: false, loading: () => <NavigationSkeleton /> },
);

function NavigationSkeleton() {
  return <Skeleton className="h-8 w-32 rounded-lg" />;
}

export function Chrome() {
  return (
    <nav
      aria-label="주 메뉴"
      className="flex w-full items-center justify-between gap-3 border-b border-neutral-200 p-4"
    >
      <Link
        href="/"
        aria-label="Jungle GYM 홈"
        className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-500"
      >
        <Logo className="h-[33px] w-[158px]" />
      </Link>
      <QueryBoundary fallback={<NavigationSkeleton />}>
        <Navigation />
      </QueryBoundary>
    </nav>
  );
}
