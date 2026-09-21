"use client";

import { LoginForm } from "@/features/auth";
import { AuthPageShell } from "./AuthPageShell";

export function LoginScreen() {
  return (
    <AuthPageShell title="로그인">
      <LoginForm />
    </AuthPageShell>
  );
}
