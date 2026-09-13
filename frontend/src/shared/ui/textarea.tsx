import * as React from "react";

import { cn } from "@/shared/lib";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "jg-control min-h-24 w-full resize-y rounded-xl border px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 md:px-3 md:py-2",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
