"use client";

import { Button, Dialog } from "@/shared/ui";

import { LogInIcon } from "./icons";

type CheckInDialogProps = {
  open: boolean;
  pending: boolean;
  error: string | null;
  now: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CheckInDialog({
  open,
  pending,
  error,
  now,
  onOpenChange,
  onConfirm,
  onCancel,
}: CheckInDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="JUNGLE GYM 입실"
      busy={pending}
      overlayClassName="bg-neutral-800/30"
      className="shadow-lg"
    >
      <h1 id="check-in-modal-title" className="flex flex-col gap-2 text-xl font-semibold">
        <div className="flex flex-row items-center justify-between">
          <span className="text-lg font-medium text-neutral-900">{now}</span>
          <LogInIcon className="text-[#05D082]" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xl font-medium text-neutral-900">
            <span className="text-[#05D082]">JUNGLE GYM</span> 입실 하시겠습니까?
          </span>
        </div>
      </h1>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col items-center justify-center gap-2">
        <Button
          type="button"
          size="plain"
          fullWidth
          loading={pending}
          disabled={pending}
          className="rounded-xl bg-neutral-800/95 px-6 py-3 text-lg font-semibold text-white hover:bg-neutral-800/90 disabled:opacity-60"
          onClick={onConfirm}
        >
          {pending ? "입실 처리 중..." : "예, 입실하겠습니다."}
        </Button>
        <Button
          type="button"
          size="plain"
          fullWidth
          variant="secondary"
          disabled={pending}
          className="rounded-xl bg-neutral-100 px-6 py-3 text-lg font-semibold text-neutral-800 hover:bg-neutral-200/80 disabled:opacity-60"
          onClick={onCancel}
        >
          아니요
        </Button>
      </div>
    </Dialog>
  );
}
