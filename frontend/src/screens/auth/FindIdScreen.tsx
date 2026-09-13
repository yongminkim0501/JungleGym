"use client";

import Link from "next/link";
import { FindIdFlow } from "@/features/recovery";
import { AuthPageShell } from "./AuthPageShell";

export function FindIdScreen() {
  return (
    <AuthPageShell title="아이디 찾기">
      <FindIdFlow />
      <Link
        href="/login"
        className="text-center text-neutral-500 hover:text-neutral-700"
      >
        로그인으로 돌아가기
      </Link>
    </AuthPageShell>
  );
}
