"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/shared/ui";

type QrActionType = "check-in" | "check-out";

type QrResultScreenProps = {
  type?: string | null;
};

function actionType(type?: string | null): QrActionType {
  return type === "check-out" ? "check-out" : "check-in";
}

function actionLabel(type?: string | null) {
  return actionType(type) === "check-out" ? "퇴실" : "입실";
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ResultShell({
  children,
  imageAlt,
  imageSrc,
}: {
  children: ReactNode;
  imageAlt: string;
  imageSrc: string;
}) {
  return (
    <section className="flex w-full flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-fit max-w-full flex-col gap-2">
        <Link
          href="/"
          className="group flex items-center gap-1 text-neutral-500 hover:text-neutral-700"
        >
          메인으로 가기
          <ArrowRightIcon />
        </Link>

        {children}

        <div className="flex w-full flex-col items-center justify-center gap-5 py-4">
          <img width="240" height="240" src={imageSrc} alt={imageAlt} />
          <Logo className="h-[33px] w-[158px]" />
        </div>
      </div>
    </section>
  );
}

export function QrSuccessScreen({ type }: QrResultScreenProps) {
  const searchParams = useSearchParams();
  const label = actionLabel(type ?? searchParams.get("type"));

  return (
    <ResultShell
      imageSrc="/image/icon/code-check.png"
      imageAlt={`${label} 처리 완료`}
    >
      <h1 className="flex w-fit flex-wrap items-center text-2xl font-semibold leading-snug md:flex-nowrap">
        <span className="mr-2 text-neutral-900">{label} 처리가 정상적으로</span>
        <span className="text-[#05D082]">완료</span>
        <span className="text-neutral-900">되었습니다.</span>
      </h1>
    </ResultShell>
  );
}

export function QrErrorScreen({ type }: QrResultScreenProps) {
  const searchParams = useSearchParams();
  const label = actionLabel(type ?? searchParams.get("type"));

  return (
    <ResultShell imageSrc="/image/icon/fail.png" imageAlt={`${label} 처리 실패`}>
      <h1 className="flex w-fit flex-wrap items-center text-2xl font-semibold leading-snug md:flex-nowrap">
        <span className="mr-2 text-neutral-900">{label} 처리에</span>
        <span className="text-[#FF1C1C]">실패</span>
        <span className="text-neutral-900">하였습니다.</span>
      </h1>
    </ResultShell>
  );
}
