"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { z } from "zod";
import { ApiError } from "@/shared/api";

export const RESEND_WAIT_MS = 60_000;
export const CODE_EXPIRES_MS = 300_000;
export const RESET_TICKET_EXPIRES_MS = 600_000;

export const sendCodeSchema = z.object({
  email: z.string().trim().email("올바른 이메일 형식이 아닙니다."),
});

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "인증코드 6자리를 입력해주세요."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상 입력해주세요.")
      .max(72, "비밀번호는 72자 이하로 입력해주세요."),
    passwordConfirm: z.string().min(1, "비밀번호를 한 번 더 입력해주세요."),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export type SendCodeValues = z.infer<typeof sendCodeSchema>;
export type VerifyCodeValues = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type RecoveryPurpose = "FIND_ID" | "RESET_PASSWORD";

export type VerificationResult = {
  ticket: string;
  email: string;
  name: string | null;
};

type FlowState = {
  email: string;
  name: string | null;
  ticket: string | null;
  sentAt: number | null;
  resendAvailableAt: number | null;
  codeExpiresAt: number | null;
  ticketExpiresAt: number | null;
};

type RecoveryState = {
  findId: FlowState;
  resetPassword: FlowState;
  beginCode: (purpose: RecoveryPurpose, email: string) => void;
  setVerification: (
    purpose: RecoveryPurpose,
    verification: VerificationResult,
  ) => void;
  clearPurpose: (purpose: RecoveryPurpose) => void;
  clearAll: () => void;
};

const emptyFlow: FlowState = {
  email: "",
  name: null,
  ticket: null,
  sentAt: null,
  resendAvailableAt: null,
  codeExpiresAt: null,
  ticketExpiresAt: null,
};

const purposeKey = {
  FIND_ID: "findId",
  RESET_PASSWORD: "resetPassword",
} as const;

export const useRecoveryStore = create<RecoveryState>((set) => ({
  findId: emptyFlow,
  resetPassword: emptyFlow,
  beginCode: (purpose, email) =>
    set((state) => {
      const now = Date.now();

      return {
        ...state,
        [purposeKey[purpose]]: {
          email,
          name: null,
          ticket: null,
          sentAt: now,
          resendAvailableAt: now + RESEND_WAIT_MS,
          codeExpiresAt: now + CODE_EXPIRES_MS,
          ticketExpiresAt: null,
        },
      };
    }),
  setVerification: (purpose, verification) =>
    set((state) => {
      const now = Date.now();

      return {
        ...state,
        [purposeKey[purpose]]: {
          ...state[purposeKey[purpose]],
          email: verification.email,
          name: verification.name,
          ticket: verification.ticket,
          ticketExpiresAt: now + RESET_TICKET_EXPIRES_MS,
        },
      };
    }),
  clearPurpose: (purpose) =>
    set((state) => ({
      ...state,
      [purposeKey[purpose]]: emptyFlow,
    })),
  clearAll: () => set({ findId: emptyFlow, resetPassword: emptyFlow }),
}));

export function useRecoveryCleanup(purpose: RecoveryPurpose) {
  const clearPurpose = useRecoveryStore((state) => state.clearPurpose);

  useEffect(() => {
    return () => clearPurpose(purpose);
  }, [clearPurpose, purpose]);
}

export function useMountedRequestGuard() {
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  function nextRequestId() {
    requestIdRef.current += 1;
    return requestIdRef.current;
  }

  function isCurrent(requestId: number) {
    return mountedRef.current && requestIdRef.current === requestId;
  }

  return { isCurrent, nextRequestId };
}

export function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [enabled]);

  return now;
}

export function formatRemaining(target: number | null, now: number) {
  const remaining = Math.max(0, Math.ceil(((target ?? now) - now) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function useRecoveryTimes(purpose: RecoveryPurpose) {
  const flow = useRecoveryStore((state) => state[purposeKey[purpose]]);
  const timerActive = Boolean(flow.codeExpiresAt || flow.ticketExpiresAt);
  const now = useNow(timerActive);

  return useMemo(() => {
    const canResend = !flow.resendAvailableAt || now >= flow.resendAvailableAt;
    const codeExpired = Boolean(
      flow.codeExpiresAt && now >= flow.codeExpiresAt,
    );
    const ticketExpired = Boolean(
      flow.ticketExpiresAt && now >= flow.ticketExpiresAt,
    );

    return {
      now,
      canResend,
      codeExpired,
      ticketExpired,
      codeTime: formatRemaining(flow.codeExpiresAt, now),
      resetTime: formatRemaining(flow.ticketExpiresAt, now),
    };
  }, [flow.codeExpiresAt, flow.resendAvailableAt, flow.ticketExpiresAt, now]);
}

export function getApiMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return fallback;
}

export function getApiFieldMessage(error: unknown, field: string) {
  if (!(error instanceof ApiError) || !error.fieldErrors) return null;
  const fieldError = (error.fieldErrors as Record<string, string | undefined>)[
    field
  ];
  return fieldError ?? null;
}
