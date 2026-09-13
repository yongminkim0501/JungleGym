import * as React from "react";

import { cn } from "@/shared/lib";

type AlertVariant = "error" | "info" | "success";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantClasses: Record<AlertVariant, string> = {
  error: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-700",
  success: "bg-emerald-50 text-emerald-700",
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", ...props }, ref) => (
    <div
      ref={ref}
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);

Alert.displayName = "Alert";
