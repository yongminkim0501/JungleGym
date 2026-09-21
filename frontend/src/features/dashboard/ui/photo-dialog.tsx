"use client";

import { useState } from "react";
import { Dialog } from "@/shared/ui";

export type PhotoDialogState = {
  url: string;
  memo: string;
  date: string;
} | null;

type PhotoDialogProps = {
  photo: PhotoDialogState;
  onOpenChange: (open: boolean) => void;
};

export function PhotoDialog({ photo, onOpenChange }: PhotoDialogProps) {
  const [failed, setFailed] = useState(false);

  return (
    <Dialog
      open={Boolean(photo)}
      onOpenChange={(open) => {
        if (!open) {
          setFailed(false);
        }
        onOpenChange(open);
      }}
      title={photo?.date ?? "오운완 사진"}
      description={photo?.memo || "오운완"}
      className="max-w-2xl overflow-hidden bg-neutral-900 p-0"
    >
      {photo ? (
        <div className="relative overflow-hidden rounded-xl bg-neutral-900">
          {!failed ? (
            <img
              src={photo.url}
              alt={photo.memo || "오운완 사진"}
              className="max-h-[75vh] min-h-60 w-full object-contain"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="flex min-h-60 w-full items-center justify-center bg-neutral-800 px-6 text-center text-sm text-neutral-300">
              이미지를 불러오지 못했습니다.
            </div>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
