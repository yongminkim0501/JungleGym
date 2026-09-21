import * as React from "react";

import { cn } from "@/shared/lib";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("jg-skeleton rounded-xl bg-neutral-200", className)}
      {...props}
    />
  );
}
