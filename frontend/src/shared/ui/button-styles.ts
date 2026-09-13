import { cn } from "@/shared/lib";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "brand"
  | "danger"
  | "ghost";
export type ButtonSize = "plain" | "sm" | "md" | "lg";

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string | undefined;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-800/95 text-white hover:bg-neutral-800/90 focus-visible:ring-neutral-800/20 disabled:opacity-50",
  secondary:
    "bg-neutral-100 text-neutral-800 hover:bg-neutral-200/80 focus-visible:ring-neutral-900/15 disabled:opacity-50",
  brand:
    "bg-[#05D082] text-white hover:bg-[#05D082]/90 focus-visible:ring-[#05D082]/30 disabled:opacity-50",
  danger:
    "bg-red-500 text-white hover:bg-red-500/80 focus-visible:ring-red-500/25 disabled:opacity-60",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-900/15 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  plain: "",
  sm: "rounded-lg px-4 py-2 text-xs",
  md: "rounded-xl px-4 py-3 text-base md:px-3 md:py-2",
  lg: "rounded-xl px-6 py-3 text-lg md:py-2",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleProps = {}) {
  return cn(
    "jg-pressable inline-flex cursor-pointer items-center justify-center gap-2 text-center font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed",
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && "w-full",
    className,
  );
}
