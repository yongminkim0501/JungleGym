"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api } from "@/shared/api";
import { Alert, Button, ButtonLink, FormField, Input } from "@/shared/ui";
import { notify } from "@/shared/notifications";
import {
  getApiFieldErrors,
  getApiMessage,
  getFieldFromCode,
  RegisterFormValues,
  registerSchema,
  useMountedGuard,
} from "./model";

const registerFields = new Set<keyof RegisterFormValues>([
  "email",
  "jungleNumber",
  "nickname",
  "name",
  "password",
  "passwordConfirm",
]);

export function RegisterForm() {
  const router = useRouter();
  const isMounted = useMountedGuard();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      jungleNumber: "",
      nickname: "",
      name: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onSubmit = handleSubmit(
    async ({ email, jungleNumber, name, nickname, password }) => {
      try {
        await api.register({ email, jungleNumber, name, nickname, password });
        if (!isMounted()) return;
        notify.success("회원가입이 완료되었습니다. 로그인해주세요.");
        router.push("/login");
      } catch (error) {
        if (!isMounted()) return;
        const fieldErrors = getApiFieldErrors(error);
        let handledField = false;

        Object.entries(fieldErrors).forEach(([field, messages]) => {
          const message = messages;
          if (!message) return;
          if (registerFields.has(field as keyof RegisterFormValues)) {
            setError(field as keyof RegisterFormValues, { message });
            handledField = true;
          }
        });

        const codeField = getFieldFromCode(error);
        if (codeField) {
          setError(codeField, {
            message: getApiMessage(error, "입력값을 확인해주세요."),
          });
          handledField = true;
        }

        const message = getApiMessage(error, "회원가입에 실패했습니다.");
        if (!handledField) {
          setError("root", { message });
        }
      }
    },
  );

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
            htmlFor="register-email"
            error={errors.email?.message}
          >
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="이메일을 입력해주세요."
              {...register("email")}
            />
          </FormField>

          <FormField
            label="정글 번호"
            htmlFor="register-jungle-number"
            error={errors.jungleNumber?.message}
          >
            <Input
              id="register-jungle-number"
              type="text"
              autoComplete="off"
              placeholder="정글 번호를 입력해주세요."
              {...register("jungleNumber")}
            />
          </FormField>

          <FormField
            label="닉네임"
            htmlFor="register-nickname"
            error={errors.nickname?.message}
          >
            <Input
              id="register-nickname"
              type="text"
              autoComplete="nickname"
              placeholder="@Nickname를 입력해주세요."
              {...register("nickname")}
            />
          </FormField>

          <FormField
            label="이름"
            htmlFor="register-name"
            error={errors.name?.message}
          >
            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="이름을 입력해주세요."
              {...register("name")}
            />
          </FormField>

          <FormField
            label="비밀번호"
            htmlFor="register-password"
            error={errors.password?.message}
          >
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호를 입력해주세요."
              {...register("password")}
            />
          </FormField>

          <FormField
            label="비밀번호 확인"
            htmlFor="register-password-confirm"
            error={errors.passwordConfirm?.message}
          >
            <Input
              id="register-password-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호를 입력해주세요."
              {...register("passwordConfirm")}
            />
          </FormField>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-2 pt-4 font-semibold md:flex-row">
          <ButtonLink href="/login" variant="secondary" size="lg" fullWidth>
            돌아가기
          </ButtonLink>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            회원가입
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
