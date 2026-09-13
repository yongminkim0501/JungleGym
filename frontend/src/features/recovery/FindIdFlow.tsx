"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/shared/api";
import { ButtonLink } from "@/shared/ui";
import { notify } from "@/shared/notifications";
import {
  getApiFieldMessage,
  getApiMessage,
  sendCodeSchema,
  SendCodeValues,
  useMountedRequestGuard,
  useRecoveryCleanup,
  useRecoveryStore,
  useRecoveryTimes,
  verifyCodeSchema,
  VerifyCodeValues,
} from "./model";
import { RecoveryCodeStep } from "./RecoveryCodeStep";
import { RecoveryEmailStep } from "./RecoveryEmailStep";

export function FindIdFlow() {
  useRecoveryCleanup("FIND_ID");

  const flow = useRecoveryStore((state) => state.findId);
  const beginCode = useRecoveryStore((state) => state.beginCode);
  const setVerification = useRecoveryStore((state) => state.setVerification);
  const { canResend, codeExpired, codeTime } = useRecoveryTimes("FIND_ID");
  const requestGuard = useMountedRequestGuard();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const step = flow.ticket ? 3 : flow.sentAt ? 2 : 1;

  const emailForm = useForm<SendCodeValues>({
    resolver: zodResolver(sendCodeSchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  const sendCode = emailForm.handleSubmit(async ({ email }) => {
    if (sending || verifying) return;
    const requestId = requestGuard.nextRequestId();
    setSending(true);
    emailForm.clearErrors();
    codeForm.clearErrors();

    try {
      await api.sendCode({ email, purpose: "FIND_ID" });
      if (!requestGuard.isCurrent(requestId)) return;
      beginCode("FIND_ID", email);
      codeForm.reset({ code: "" });
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
    if (sending || verifying) return;
    if (codeExpired) {
      codeForm.setError("root", {
        message: "인증코드가 만료되었습니다. 다시 전송해주세요.",
      });
      return;
    }

    const requestId = requestGuard.nextRequestId();
    setVerifying(true);
    codeForm.clearErrors();

    try {
      const verification = await api.verifyCode({
        email: flow.email,
        code,
        purpose: "FIND_ID",
      });
      if (!requestGuard.isCurrent(requestId)) return;
      setVerification("FIND_ID", verification);
      codeForm.clearErrors();
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

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      {step === 1 ? (
        <RecoveryEmailStep
          form={emailForm}
          inputId="find-id-email"
          pending={sending}
          rootError={emailForm.formState.errors.root?.message}
          onSubmit={sendCode}
        />
      ) : null}

      {step === 2 ? (
        <RecoveryCodeStep
          form={codeForm}
          email={flow.email}
          emailInputId="find-id-verified-email"
          codeInputId="find-id-code"
          codeExpired={codeExpired}
          codeTime={codeTime}
          canResend={canResend}
          rootError={codeForm.formState.errors.root?.message}
          expiredMessage="인증코드가 만료되었습니다. 다시 전송해주세요."
          sending={sending}
          verifying={verifying}
          onResend={() => {
            void sendCode();
          }}
          onSubmit={verifyCode}
        />
      ) : null}

      {step === 3 ? (
        <div className="flex w-full flex-col gap-5 py-4">
          <div className="flex w-full items-center justify-between rounded-xl border border-[#00103D]/12 px-4 py-3 md:px-3 md:py-2">
            <span className="font-medium text-neutral-700">{flow.email}</span>
            <span className="text-sm text-neutral-500">{flow.name ?? ""}</span>
          </div>

          <ButtonLink href="/login" variant="primary" size="lg" fullWidth>
            로그인
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
