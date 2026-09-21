"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useRouter } from "next/navigation";
import { ApiError } from "@/shared/api";
import { Alert, Button } from "@/shared/ui";

function QueryError({
  error,
  resetErrorBoundary,
  unauthorizedHref,
}: FallbackProps & { unauthorizedHref?: string }) {
  const router = useRouter();
  const unauthorized = error instanceof ApiError && error.status === 401;
  useEffect(() => {
    if (unauthorized && unauthorizedHref) router.replace(unauthorizedHref);
  }, [router, unauthorized, unauthorizedHref]);

  if (unauthorized && unauthorizedHref)
    return (
      <p role="status" className="p-4 text-sm text-neutral-500">
        로그인 화면으로 이동합니다.
      </p>
    );
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 p-4">
      <Alert variant="error">
        {error instanceof ApiError
          ? error.message
          : "정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}
      </Alert>
      <Button variant="secondary" size="sm" onClick={resetErrorBoundary}>
        다시 시도
      </Button>
    </div>
  );
}

export function QueryBoundary({
  children,
  fallback,
  unauthorizedHref,
}: {
  children: ReactNode;
  fallback: ReactNode;
  unauthorizedHref?: string;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={(props) => (
            <QueryError
              {...props}
              {...(unauthorizedHref ? { unauthorizedHref } : {})}
            />
          )}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
