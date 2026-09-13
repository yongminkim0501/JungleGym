"use client";

import * as React from "react";
import { toast } from "sonner";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

type NotifyKind = "success" | "error" | "info" | "loading";
type ToastId = string | number;

export interface NotifyOptions {
  id?: ToastId;
  description?: React.ReactNode;
  duration?: number;
}

const durationByKind: Record<NotifyKind, number> = {
  success: 4000,
  info: 4000,
  error: 6000,
  loading: Infinity,
};

const kindClasses: Record<NotifyKind, string> = {
  success: "border-emerald-200 bg-white text-emerald-700",
  error: "border-red-200 bg-white text-red-700",
  info: "border-sky-200 bg-white text-sky-700",
  loading: "border-neutral-200 bg-white text-neutral-700",
};

const iconClasses: Record<NotifyKind, string> = {
  success: "bg-[#05D082]/10 text-[#05A96A]",
  error: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  loading: "bg-neutral-100 text-neutral-500",
};

function NotifyIcon({ kind }: { kind: NotifyKind }) {
  if (kind === "loading") {
    return (
      <span
        aria-hidden="true"
        className="jg-spinner size-4 rounded-full border-2 border-current border-r-transparent"
      />
    );
  }

  if (kind === "error") {
    return (
      <svg
        aria-hidden="true"
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v5m0 4h.01"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.3 4.3l-8 14A2 2 0 004 21h16a2 2 0 001.7-2.7l-8-14a2 2 0 00-3.4 0z"
        />
      </svg>
    );
  }

  if (kind === "info") {
    return (
      <svg
        aria-hidden="true"
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 11v5" />
        <path strokeLinecap="round" d="M12 8h.01" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ToastContent({
  id,
  kind,
  message,
  description,
}: {
  id: ToastId;
  kind: NotifyKind;
  message: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "jg-toast pointer-events-auto flex w-full min-w-[280px] max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg",
        kindClasses[kind],
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
          iconClasses[kind],
        )}
      >
        <NotifyIcon kind={kind} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm leading-5 font-semibold text-neutral-900">
          {message}
        </p>
        {description ? (
          <div className="mt-1 text-sm leading-5 text-neutral-500">
            {description}
          </div>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="plain"
        aria-label="알림 닫기"
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-[#05D082]/30"
        onClick={() => toast.dismiss(id)}
      >
        <svg
          aria-hidden="true"
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </Button>
    </div>
  );
}

function show(
  kind: NotifyKind,
  message: React.ReactNode,
  options?: NotifyOptions,
) {
  const toastOptions = {
    duration: options?.duration ?? durationByKind[kind],
    ...(options?.id === undefined ? {} : { id: options.id }),
  };

  return toast.custom(
    (id) => (
      <ToastContent
        id={id}
        kind={kind}
        message={message}
        description={options?.description}
      />
    ),
    toastOptions,
  );
}

export const notify = {
  success(message: React.ReactNode, options?: NotifyOptions) {
    return show("success", message, options);
  },
  error(message: React.ReactNode, options?: NotifyOptions) {
    return show("error", message, options);
  },
  info(message: React.ReactNode, options?: NotifyOptions) {
    return show("info", message, options);
  },
  loading(message: React.ReactNode, options?: NotifyOptions) {
    return show("loading", message, options);
  },
  dismiss(id?: ToastId) {
    toast.dismiss(id);
  },
};
