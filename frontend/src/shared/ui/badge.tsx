import * as React from "react";

import { cn } from "@/shared/lib";

type BadgeVariant = "neutral" | "brand" | "success" | "danger" | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  brand: "bg-[#05D082]/10 text-[#047B4F]",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";
