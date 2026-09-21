"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      visibleToasts={3}
      closeButton={false}
      expand={false}
      offset={{ top: "calc(env(safe-area-inset-top) + 16px)" }}
      mobileOffset={{
        top: "calc(env(safe-area-inset-top) + 12px)",
        left: "12px",
        right: "12px",
      }}
      toastOptions={{
        unstyled: true,
        duration: 4000,
      }}
    />
  );
}
