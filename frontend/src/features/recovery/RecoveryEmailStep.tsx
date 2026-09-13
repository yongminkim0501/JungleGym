"use client";

import type { UseFormReturn } from "react-hook-form";
import { Alert, Button, FormField, Input } from "@/shared/ui";
import type { SendCodeValues } from "./model";

type RecoveryEmailStepProps = {
  form: UseFormReturn<SendCodeValues>;
  inputId: string;
  pending: boolean;
  rootError?: string | undefined;
  onSubmit: () => void;
};

export function RecoveryEmailStep({
  form,
  inputId,
  pending,
  rootError,
  onSubmit,
}: RecoveryEmailStepProps) {
  return (
    <form
      className="flex w-full flex-col gap-5 py-4"
      noValidate
      onSubmit={onSubmit}
    >
      {rootError ? <Alert variant="error">{rootError}</Alert> : null}

      <FormField
        label="이메일"
        htmlFor={inputId}
        error={form.formState.errors.email?.message}
      >
        <div className="relative w-full">
          <Input
            id={inputId}
            type="email"
            autoComplete="email"
            placeholder="이메일을 입력해주세요."
            className="pr-24 md:pr-24"
            disabled={pending}
            {...form.register("email")}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={pending}
            className="absolute right-[8px] top-1/2 -translate-y-1/2"
          >
            코드 전송
          </Button>
        </div>
      </FormField>

      <Button type="button" variant="primary" size="lg" fullWidth disabled>
        다음
      </Button>
    </form>
  );
}
