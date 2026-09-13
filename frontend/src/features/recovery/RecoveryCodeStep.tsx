"use client";

import type { UseFormReturn } from "react-hook-form";
import { Alert, Button, FormField, Input } from "@/shared/ui";
import type { VerifyCodeValues } from "./model";

type RecoveryCodeStepProps = {
  form: UseFormReturn<VerifyCodeValues>;
  email: string;
  emailInputId: string;
  codeInputId: string;
  codeExpired: boolean;
  codeTime: string;
  canResend: boolean;
  rootError?: string | undefined;
  expiredMessage?: string | undefined;
  sending: boolean;
  verifying: boolean;
  onResend: () => void;
  onSubmit: () => void;
};

export function RecoveryCodeStep({
  canResend,
  codeExpired,
  codeInputId,
  codeTime,
  email,
  emailInputId,
  expiredMessage,
  form,
  onResend,
  onSubmit,
  rootError,
  sending,
  verifying,
}: RecoveryCodeStepProps) {
  const busy = sending || verifying;

  return (
    <form
      className="flex w-full flex-col gap-5 py-4"
      noValidate
      onSubmit={onSubmit}
    >
      {rootError ? <Alert variant="error">{rootError}</Alert> : null}
      {codeExpired && expiredMessage ? (
        <Alert variant="error">{expiredMessage}</Alert>
      ) : null}

      <div className="flex flex-col gap-4">
        <FormField label="이메일" htmlFor={emailInputId}>
          <div className="relative w-full">
            <Input
              id={emailInputId}
              type="email"
              value={email}
              readOnly
              className="bg-neutral-50 pr-24 text-neutral-600 md:pr-24"
            />
            <span
              className="absolute right-[8px] top-1/2 -translate-y-1/2 rounded-lg bg-neutral-200 px-4 py-2 text-xs font-semibold tabular-nums text-neutral-700 data-[expired=true]:bg-red-100 data-[expired=true]:text-red-600"
              data-expired={codeExpired}
            >
              {codeTime}
            </span>
          </div>
        </FormField>

        {canResend ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={sending}
            disabled={verifying}
            onClick={onResend}
            className="self-start"
          >
            코드 재전송
          </Button>
        ) : null}

        <FormField
          label="인증코드"
          htmlFor={codeInputId}
          error={form.formState.errors.code?.message}
        >
          <Input
            id={codeInputId}
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="인증코드 6자리를 입력해주세요."
            disabled={busy || codeExpired}
            {...form.register("code")}
          />
        </FormField>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={verifying}
        disabled={sending || codeExpired}
      >
        다음
      </Button>
    </form>
  );
}
