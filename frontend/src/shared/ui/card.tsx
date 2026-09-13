import * as React from "react";

import { cn } from "@/shared/lib";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-neutral-200 bg-white px-4 py-4",
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";
