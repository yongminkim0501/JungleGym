"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import { cn } from "@/shared/lib";

import { useMotionPresence } from "./motion-presence";
import { useModalFocus } from "./modal-focus";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  busy?: boolean;
  header?: "sr-only" | "visible";
  showCloseButton?: boolean;
  overlayClassName?: string;
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  busy = false,
  header = "sr-only",
  showCloseButton = false,
  overlayClassName,
  className,
}: SheetProps) {
  const { present, overlayRef, contentRef } = useMotionPresence({
    open,
    kind: "sheet",
  });
  const radixOpen = open || present;
  const headerVisible = header === "visible";
  const focusHandlers = useModalFocus();

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && busy) {
        return;
      }

      onOpenChange(nextOpen);
    },
    [busy, onOpenChange],
  );

  return (
    <DialogPrimitive.Root open={radixOpen} onOpenChange={handleOpenChange}>
      {radixOpen ? (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay
            ref={overlayRef}
            forceMount
            className={cn(
              "jg-overlay fixed inset-0 z-50 bg-black/40",
              overlayClassName,
            )}
          />
          <DialogPrimitive.Content
            ref={contentRef}
            forceMount
            data-jg-modal="sheet"
            {...focusHandlers}
            {...(description ? {} : { "aria-describedby": undefined })}
            aria-busy={busy || undefined}
            data-exiting={!open ? "true" : undefined}
            onEscapeKeyDown={(event) => {
              if (busy) {
                event.preventDefault();
              }
            }}
            onPointerDownOutside={(event) => {
              if (busy) {
                event.preventDefault();
              }
            }}
            className={cn(
              "jg-sheet-content fixed left-1/2 bottom-0 z-50 flex max-h-[calc(100dvh-0.5rem)] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl outline-none md:top-1/2 md:bottom-auto md:max-h-[95vh] md:w-[calc(100%-2rem)] md:rounded-2xl md:p-6",
              className,
            )}
          >
            <div
              className={cn(
                headerVisible
                  ? "mb-4 flex items-start justify-between gap-4"
                  : "sr-only",
              )}
            >
              <div className={headerVisible ? "space-y-1" : undefined}>
                <DialogPrimitive.Title
                  className={
                    headerVisible
                      ? "text-lg font-bold text-neutral-900"
                      : undefined
                  }
                >
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description
                    className={
                      headerVisible
                        ? "text-sm leading-6 text-neutral-500"
                        : undefined
                    }
                  >
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
              {showCloseButton ? (
                <DialogPrimitive.Close
                  disabled={busy}
                  aria-label="닫기"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#05D082]/30 disabled:pointer-events-none disabled:opacity-50"
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
                </DialogPrimitive.Close>
              ) : null}
            </div>
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      ) : null}
    </DialogPrimitive.Root>
  );
}
