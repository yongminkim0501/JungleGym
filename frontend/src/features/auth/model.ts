"use client";

import { useEffect, useRef } from "react";
import { z } from "zod";
import { ApiError } from "@/shared/api";

export const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const registerSchema = z
  .object({
    email: z.string().trim().email("올바른 이메일 형식이 아닙니다."),
    jungleNumber: z
      .string()
      .trim()
      .min(1, "정글 번호를 입력해주세요.")
      .max(50, "정글 번호는 50자 이하로 입력해주세요."),
    nickname: z
      .string()
      .trim()
      .min(4, "닉네임은 4자 이상 25자 이하로 입력해주세요.")
      .max(25, "닉네임은 4자 이상 25자 이하로 입력해주세요."),
    name: z
      .string()
      .trim()
      .min(1, "이름을 입력해주세요.")
      .max(50, "이름은 50자 이하로 입력해주세요."),
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

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

type FieldErrorBag = Record<string, string | undefined>;

const fieldLabels: Record<
  string,
  keyof RegisterFormValues | keyof LoginFormValues
> = {
  EMAIL_ALREADY_EXISTS: "email",
  NICKNAME_ALREADY_EXISTS: "nickname",
  JUNGLE_NUMBER_ALREADY_EXISTS: "jungleNumber",
};

export function getApiMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return fallback;
}

export function getApiFieldErrors(error: unknown): FieldErrorBag {
  if (error instanceof ApiError && error.fieldErrors) {
    return error.fieldErrors as FieldErrorBag;
  }
  return {};
}

export function getFieldFromCode(error: unknown) {
  if (error instanceof ApiError && error.code) {
    return fieldLabels[error.code] ?? null;
  }
  return null;
}

export function useMountedGuard() {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return function isMounted() {
    return mountedRef.current;
  };
}
