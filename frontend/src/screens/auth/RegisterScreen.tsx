"use client";

import { RegisterForm } from "@/features/auth";
import { AuthPageShell } from "./AuthPageShell";

export function RegisterScreen() {
  return (
    <AuthPageShell title="회원가입">
      <RegisterForm />
    </AuthPageShell>
  );
}
