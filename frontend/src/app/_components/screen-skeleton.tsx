import { Skeleton } from "@/shared/ui";

export type ScreenKind =
  | "login"
  | "register"
  | "find-id"
  | "find-password"
  | "dashboard"
  | "history"
  | "info"
  | "qr"
  | "qr-success"
  | "qr-error";

function HeadingSkeleton({ backlink = false }: { backlink?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {backlink && <Skeleton className="h-6 w-28 rounded" />}
      <Skeleton className="h-[33px] w-64 max-w-full rounded" />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-4">
      <Skeleton className="size-20 rounded-full" />
      <Skeleton className="mt-2 h-7 w-24" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-3 h-[82px] w-full" />
      <Skeleton className="mt-4 h-11 w-full md:h-9" />
    </div>
  );
}

export function ScreenSkeleton({ kind = "login" }: { kind?: ScreenKind }) {
  if (kind === "dashboard")
    return (
      <section
        aria-label="대시보드 불러오는 중"
        role="status"
        className="flex w-full flex-1 bg-neutral-50/50 px-4 pb-32 pt-6 md:px-6 md:py-8"
      >
        <div className="mx-auto grid w-full gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="order-3 flex flex-col gap-4 lg:order-1">
            <HeadingSkeleton backlink />
            <ProfileSkeleton />
          </aside>
          <div className="order-2 flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <HeadingSkeleton backlink />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="h-[114px] rounded-xl sm:h-[122px]" />
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.75fr)]">
              <div className="rounded-xl border border-neutral-200 bg-white px-3 py-4 sm:px-4">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="mt-1 h-7 w-44" />
                <div className="mt-4 grid grid-cols-7 gap-px sm:mt-5">
                  {Array.from({ length: 42 }, (_, i) => (
                    <Skeleton
                      key={i}
                      className={
                        i < 7 ? "h-8 rounded-none" : "h-14 rounded-none md:h-20"
                      }
                    />
                  ))}
                </div>
                <Skeleton className="mt-4 h-8 w-full" />
              </div>
              <div className="flex flex-col gap-5">
                <Skeleton className="hidden h-[233px] md:block" />
                <Skeleton className="h-56" />
              </div>
            </div>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
          <Skeleton className="h-11" />
        </div>
      </section>
    );

  if (kind === "history" || kind === "info")
    return (
      <section
        aria-label={
          kind === "history" ? "활동기록 불러오는 중" : "프로필 불러오는 중"
        }
        role="status"
        className="flex w-full flex-1 bg-neutral-50/50 px-4 py-10"
      >
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
          <HeadingSkeleton backlink />
          {kind === "info" ? (
            <div className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white px-5 py-6">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="mt-4 h-7 w-24" />
              <Skeleton className="mt-1 h-5 w-40" />
              <Skeleton className="mt-6 h-[82px] w-full" />
              <Skeleton className="mt-5 h-[104px] w-full sm:h-12" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <Skeleton className="h-11 rounded-none" />
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="flex justify-between gap-5 border-t border-neutral-100 px-5 py-4"
                  >
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12" />
            </>
          )}
        </div>
      </section>
    );

  const qr = kind === "qr";
  const result = kind === "qr-success" || kind === "qr-error";
  const recovery = kind === "find-id" || kind === "find-password";
  return (
    <section
      aria-label="화면 불러오는 중"
      role="status"
      className="flex w-full flex-1 items-center justify-center px-4 py-10"
    >
      <div className="flex w-full max-w-xs flex-col gap-2">
        <HeadingSkeleton backlink={qr || result} />
        {result ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <Skeleton className="size-60 rounded-full" />
            <Skeleton className="h-[33px] w-[158px]" />
          </div>
        ) : qr ? (
          <div className="flex gap-2 py-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-4">
              {Array.from(
                { length: kind === "register" ? 6 : recovery ? 1 : 2 },
                (_, i) => (
                  <div className="flex flex-col gap-2" key={i}>
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-[50px] md:h-[42px]" />
                  </div>
                ),
              )}
            </div>
            <div
              className={`flex flex-col gap-2 ${recovery ? "" : "pt-4 md:flex-row"}`}
            >
              {!recovery && <Skeleton className="h-[52px] w-full md:h-11" />}
              <Skeleton className="h-[52px] w-full md:h-11" />
            </div>
            {!recovery && <Skeleton className="h-6 w-28 rounded" />}
          </div>
        )}
        {recovery && <Skeleton className="mx-auto h-6 w-40 rounded" />}
      </div>
    </section>
  );
}
