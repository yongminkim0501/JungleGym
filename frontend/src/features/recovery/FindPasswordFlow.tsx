"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/shared/api";
import { Alert, Button, FormField, Input } from "@/shared/ui";
import { notify } from "@/shared/notifications";
import {
  getApiFieldMessage,
  getApiMessage,
  resetPasswordSchema,
  type ResetPasswordValues,
  sendCodeSchema,
  type SendCodeValues,
  useMountedRequestGuard,
  useRecoveryCleanup,
  useRecoveryStore,
  useRecoveryTimes,
  verifyCodeSchema,
  type VerifyCodeValues,
} from "./model";
import { RecoveryCodeStep } from "./RecoveryCodeStep";
import { RecoveryEmailStep } from "./RecoveryEmailStep";

const codeExpiredMessage = "인증코드가 만료되었습니다. 다시 전송해주세요.";
const ticketExpiredMessage =
  "비밀번호 변경 가능 시간이 만료되었습니다. 다시 인증해주세요.";

export function FindPasswordFlow() {
  useRecoveryCleanup("RESET_PASSWORD");

  const flow = useRecoveryStore((state) => state.resetPassword);
  const beginCode = useRecoveryStore((state) => state.beginCode);
  const setVerification = useRecoveryStore((state) => state.setVerification);
  const clearPurpose = useRecoveryStore((state) => state.clearPurpose);
  const { canResend, codeExpired, codeTime, resetTime, ticketExpired } =
    useRecoveryTimes("RESET_PASSWORD");
  const requestGuard = useMountedRequestGuard();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const step = resetComplete ? 4 : flow.ticket ? 3 : flow.sentAt ? 2 : 1;

  const emailForm = useForm<SendCodeValues>({
    resolver: zodResolver(sendCodeSchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  const sendCode = emailForm.handleSubmit(async ({ email }) => {
    if (sending || verifying || resetting) return;
    const requestId = requestGuard.nextRequestId();
    setSending(true);
    emailForm.clearErrors();
    codeForm.clearErrors();
    resetForm.clearErrors();

    try {
      await api.sendCode({ email, purpose: "RESET_PASSWORD" });
      if (!requestGuard.isCurrent(requestId)) return;
      beginCode("RESET_PASSWORD", email);
      setResetComplete(false);
      codeForm.reset({ code: "" });
      resetForm.reset({ password: "", passwordConfirm: "" });
      notify.info("입력한 이메일로 인증코드 발송을 요청했습니다.");
    } catch (error) {
      if (!requestGuard.isCurrent(requestId)) return;
      const fieldMessage = getApiFieldMessage(error, "email");
      if (fieldMessage) {
        emailForm.setError("email", { message: fieldMessage });
      }
      const message = getApiMessage(error, "인증코드 전송에 실패했습니다.");
      if (!fieldMessage) emailForm.setError("root", { message });
    } finally {
      if (requestGuard.isCurrent(requestId)) {
        setSending(false);
      }
    }
  });

  const verifyCode = codeForm.handleSubmit(async ({ code }) => {
    if (sending || verifying || resetting) return;
    if (codeExpired) {
      codeForm.setError("root", { message: codeExpiredMessage });
      return;
    }

    const requestId = requestGuard.nextRequestId();
    setVerifying(true);
    codeForm.clearErrors();

    try {
      const verification = await api.verifyCode({
        email: flow.email,
        code,
        purpose: "RESET_PASSWORD",
      });
      if (!requestGuard.isCurrent(requestId)) return;
      setVerification("RESET_PASSWORD", verification);
      codeForm.clearErrors();
      resetForm.clearErrors();
      notify.success("인증이 완료되었습니다.");
    } catch (error) {
      if (!requestGuard.isCurrent(requestId)) return;
      const fieldMessage = getApiFieldMessage(error, "code");
      if (fieldMessage) {
        codeForm.setError("code", { message: fieldMessage });
      }
      const message =
        error instanceof ApiError && error.code === "INVALID_VERIFICATION_CODE"
          ? error.message || "인증코드가 올바르지 않습니다."
          : getApiMessage(error, "인증코드 확인에 실패했습니다.");
      if (!fieldMessage) codeForm.setError("root", { message });
    } finally {
      if (requestGuard.isCurrent(requestId)) {
        setVerifying(false);
      }
    }
  });

  const resetPassword = resetForm.handleSubmit(async ({ password }) => {
    if (sending || verifying || resetting) return;
    if (!flow.ticket || ticketExpired) {
      resetForm.setError("root", { message: ticketExpiredMessage });
      return;
    }

    const requestId = requestGuard.nextRequestId();
    setResetting(true);
    resetForm.clearErrors();

    try {
      await api.resetPassword({ ticket: flow.ticket, password });
      if (!requestGuard.isCurrent(requestId)) return;
      clearPurpose("RESET_PASSWORD");
      resetForm.reset({ password: "", passwordConfirm: "" });
      setResetComplete(true);
      notify.success("비밀번호가 변경되었습니다.");
    } catch (error) {
      if (!requestGuard.isCurrent(requestId)) return;
      const fieldMessage = getApiFieldMessage(error, "password");
      if (fieldMessage) {
        resetForm.setError("password", { message: fieldMessage });
      }
      const message =
        error instanceof ApiError &&
        error.code === "INVALID_VERIFICATION_TICKET"
          ? error.message || ticketExpiredMessage
          : getApiMessage(error, "비밀번호 변경에 실패했습니다.");
      if (!fieldMessage) resetForm.setError("root", { message });
    } finally {
      if (requestGuard.isCurrent(requestId)) {
        setResetting(false);
      }
    }
  });

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      {step === 1 ? (
        <RecoveryEmailStep
          form={emailForm}
          inputId="find-password-email"
          pending={sending}
          rootError={emailForm.formState.errors.root?.message}
          onSubmit={sendCode}
        />
      ) : null}

      {step === 2 ? (
        <RecoveryCodeStep
          form={codeForm}
          email={flow.email}
          emailInputId="find-password-verified-email"
          codeInputId="find-password-code"
          codeExpired={codeExpired}
          codeTime={codeTime}
          canResend={canResend}
          rootError={codeForm.formState.errors.root?.message}
          expiredMessage={codeExpiredMessage}
          sending={sending}
          verifying={verifying}
          onResend={() => {
            void sendCode();
          }}
          onSubmit={verifyCode}
        />
      ) : null}

      {step === 3 ? (
        <form
          className="flex w-full flex-col gap-5 py-4"
          noValidate
          onSubmit={resetPassword}
        >
          {resetForm.formState.errors.root?.message ? (
            <Alert variant="error">
              {resetForm.formState.errors.root.message}
            </Alert>
          ) : null}
          {ticketExpired ? (
            <Alert variant="error">{ticketExpiredMessage}</Alert>
          ) : null}

          <div className="flex flex-col gap-4">
            <FormField
              label="새로운 비밀번호"
              htmlFor="find-password-new"
              error={resetForm.formState.errors.password?.message}
            >
              <Input
                id="find-password-new"
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호를 입력해주세요."
                disabled={resetting || ticketExpired}
                {...resetForm.register("password")}
              />
            </FormField>

            <FormField
              label="비밀번호 확인"
              htmlFor="find-password-confirm"
              error={resetForm.formState.errors.passwordConfirm?.message}
            >
              <Input
                id="find-password-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호를 입력해주세요."
                disabled={resetting || ticketExpired}
                {...resetForm.register("passwordConfirm")}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">비밀번호 변경 가능 시간</span>
            <span
              className="font-medium text-[#05D082] data-[expired=true]:text-red-600"
              data-expired={ticketExpired}
            >
              {resetTime}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={resetting}
            disabled={ticketExpired}
          >
            비밀번호 초기화
          </Button>
        </form>
      ) : null}

      {step === 4 ? (
        <div className="flex w-full flex-col gap-5 py-4">
          <Alert variant="success">
            비밀번호가 변경되었습니다. 로그인 화면에서 새 비밀번호로
            로그인해주세요.
          </Alert>
          <Button type="button" variant="primary" size="lg" fullWidth disabled>
            확인완료
          </Button>
        </div>
      ) : null}
    </div>
  );
}
