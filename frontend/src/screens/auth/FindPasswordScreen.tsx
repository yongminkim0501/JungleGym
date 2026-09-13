"use client";

import Link from "next/link";
import { FindPasswordFlow } from "@/features/recovery";
import { AuthPageShell } from "./AuthPageShell";

export function FindPasswordScreen() {
  return (
    <AuthPageShell title="비밀번호 찾기">
      <FindPasswordFlow />
      <Link
        href="/login"
        className="text-center text-neutral-500 hover:text-neutral-700"
      >
        로그인으로 돌아가기
      </Link>
    </AuthPageShell>
  );
}
