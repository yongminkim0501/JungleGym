"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/shared/api";
import {
  Alert,
  Button,
  ButtonLink,
  FormField,
  Input,
  PasswordInput,
} from "@/shared/ui";
import { notify } from "@/shared/notifications";
import { queryKeys } from "@/entities";
import {
  getApiFieldErrors,
  getApiMessage,
  LoginFormValues,
  loginSchema,
  useMountedGuard,
} from "./model";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMounted = useMountedGuard();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await api.login(values);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.session }),
        queryClient.cancelQueries({ queryKey: queryKeys.dashboard }),
        queryClient.cancelQueries({ queryKey: queryKeys.visits }),
      ]);
      queryClient.removeQueries({ queryKey: queryKeys.dashboard });
      queryClient.removeQueries({ queryKey: queryKeys.visits });
      queryClient.setQueryData(queryKeys.session, user);
      if (!isMounted()) return;
      notify.success("로그인되었습니다.");
      router.push("/");
    } catch (error) {
      if (!isMounted()) return;
      const fieldErrors = getApiFieldErrors(error);
      const emailError = fieldErrors.email;
      const passwordError = fieldErrors.password;
      if (emailError) setError("email", { message: emailError });
      if (passwordError) setError("password", { message: passwordError });
      if (emailError || passwordError) return;

      if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
        setError("root", {
          message: error.message || "이메일 또는 비밀번호를 확인해주세요.",
        });
        return;
      }
      const message = getApiMessage(error, "로그인에 실패했습니다.");
      setError("root", { message });
    }
  });

  return (
    <form
      className="flex w-full max-w-xs flex-col gap-2"
      noValidate
      onSubmit={onSubmit}
    >
      {errors.root?.message ? (
        <Alert variant="error">{errors.root.message}</Alert>
      ) : null}

      <div className="flex w-full flex-col gap-5 py-4">
        <div className="flex w-full flex-col gap-4">
          <FormField
            label="이메일"
            htmlFor="login-email"
            error={errors.email?.message}
          >
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="이메일을 입력해주세요."
              {...register("email")}
            />
          </FormField>

          <FormField
            label="비밀번호"
            htmlFor="login-password"
            error={errors.password?.message}
          >
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력해주세요."
              {...register("password")}
            />
          </FormField>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-2 pt-4 font-semibold md:flex-row">
          <ButtonLink href="/register" variant="secondary" size="lg" fullWidth>
            회원가입
          </ButtonLink>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            로그인
          </Button>
        </div>

        <div className="flex items-center text-base text-neutral-500">
          <Link href="/find-password" className="hover:text-neutral-700">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </form>
  );
}
