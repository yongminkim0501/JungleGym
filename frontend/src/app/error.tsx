"use client";

import { Alert, Button } from "@/shared/ui";

export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <Alert variant="error">
        화면을 불러오지 못했습니다. 다시 시도해 주세요.
      </Alert>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
