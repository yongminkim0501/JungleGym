"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/shared/ui";
import { adminApi } from "@/features/admin";

export function LoginForm() {
  const router = useRouter();
  const queries = useQueryClient();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = String(new FormData(form).get("token") ?? "").trim();
    setPending(true); setError("");
    try {
      await adminApi.login(token);
      form.reset();
      queries.removeQueries({ queryKey: ["admin"] });
      router.replace("/admin"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "로그인에 실패했습니다.");
    } finally { setPending(false); }
  }
  return (
    <div className="flex flex-1 items-center justify-center bg-[#f5f8f6] px-5 py-16">
      <section className="w-full max-w-md rounded-2xl border border-[#e1e8e3] bg-white p-8 shadow-sm">
        <Logo className="mb-10 w-[152px]" />
        <p className="mb-3 text-xs font-semibold tracking-widest text-emerald-700">JUNGLE GYM · ADMIN</p>
        <h1 className="text-2xl font-bold tracking-tight">관리자 로그인</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">전달받은 개인 토큰을 입력해 주세요.</p>
        <form onSubmit={login} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-token" className="mb-2 block text-sm font-medium">관리자 토큰</label>
            <input
              id="admin-token"
              name="token"
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={256}
              disabled={pending}
              aria-describedby={error ? "login-error" : undefined}
              aria-invalid={Boolean(error)}
              placeholder="개인 토큰을 입력하세요"
              className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-100"
            />
          </div>
          {error && <p id="login-error" role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={pending} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? "확인 중…" : "로그인"}
          </button>
        </form>
        <p className="mt-6 text-xs leading-5 text-neutral-500">관리자 전용 · 로그인은 최대 8시간 유지됩니다.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-neutral-500 underline underline-offset-4">서비스 홈으로</Link>
      </section>
    </div>
  );
}
