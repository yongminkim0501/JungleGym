"use client";

import * as React from "react";

import { cn } from "@/shared/lib";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const inputClassName =
  "jg-control w-full rounded-xl border px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 md:px-3 md:py-2";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputClassName, className)}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export interface PasswordInputProps
  extends Omit<InputProps, "type" | "autoComplete"> {
  autoComplete?: InputProps["autoComplete"];
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ className, autoComplete = "current-password", ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        className={cn(inputClassName, "pr-10 md:pr-10", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center text-neutral-500 outline-none focus-visible:ring-2 focus-visible:ring-[#05D082]/30 disabled:pointer-events-none disabled:opacity-50"
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-3.4M9.9 5.2A9.5 9.5 0 0112 5c5 0 8.5 4.2 9.5 7a12.6 12.6 0 01-2.8 4.1M6.2 6.2A12.2 12.2 0 002.5 12c.8 2.4 3.9 6.5 9.5 6.5 1.3 0 2.5-.2 3.6-.7"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.5 12S5.5 5 12 5s9.5 7 9.5 7-3 7-9.5 7-9.5-7-9.5-7z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
