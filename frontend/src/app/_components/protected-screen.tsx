"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { sessionQueryOptions } from "@/entities/session";
import { GymDialogs } from "@/features/gym";

export function ProtectedScreen({ children }: { children: ReactNode }) {
  const { data: user } = useSuspenseQuery(sessionQueryOptions());
  const router = useRouter();
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [router, user]);
  if (!user)
    return (
      <p className="p-4 text-sm text-neutral-500" role="status">
        로그인 화면으로 이동합니다.
      </p>
    );
  return (
    <>
      {children}
      <GymDialogs />
    </>
  );
}
