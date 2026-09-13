"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <p className="p-4 text-sm text-neutral-500" role="status">
      메인 화면으로 이동합니다.
    </p>
  );
}
