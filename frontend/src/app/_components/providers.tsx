"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ApiError } from "@/shared/api";
import { AppToaster } from "@/shared/notifications";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            // A background request can lose authorization while its old data is cached.
            // A fresh document also discards every private query and transient draft.
            if (error instanceof ApiError && error.status === 401 && query.queryKey[0] !== "admin")
              window.location.replace("/login");
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: false,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey)
        document.documentElement.dataset.input = "keyboard";
    };
    const pointer = () => {
      document.documentElement.dataset.input = "pointer";
    };
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AppToaster />
    </QueryClientProvider>
  );
}
