"use client";

import { type ChangeEvent, type FormEvent, useRef } from "react";

import { cn } from "@/shared/lib";
import { Button, Sheet } from "@/shared/ui";

type WorkoutDraft = {
  title: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
};

type WorkoutRecordSheetProps = {
  open: boolean;
  pending: boolean;
  error: string | null;
  draft: WorkoutDraft;
  tags: readonly string[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  onAppendTag: (tag: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onCancel: () => void;
  onSkipRecord: () => void;
};


export function WorkoutRecordSheet({
  open,
  pending,
  error,
  draft,
  tags,
  onOpenChange,
  onSubmit,
  onTitleChange,
  onAppendTag,
  onFileChange,
  onRemoveImage,
  onCancel,
  onSkipRecord,
}: WorkoutRecordSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="오운완 기록 작성"
      busy={pending}
      overlayClassName="bg-neutral-800/40"
      className="bg-transparent p-0 shadow-none md:p-0"
    >
      <form
        className="flex max-h-[calc(100dvh-0.5rem)] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl md:max-h-[95vh] md:rounded-2xl md:p-6"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pb-4 pt-3 md:px-0 md:pb-4 md:pt-0">
          <div className="mx-auto h-1.5 w-18 rounded-full bg-neutral-200 md:hidden" />

          {error ? (
            <p role="alert" className="-mb-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-1 pt-2">
            <label htmlFor="workout-title" className="sr-only">
              오늘의 운동 기록
            </label>
            <textarea
              id="workout-title"
              name="title"
              rows={1}
              maxLength={100}
              value={draft.title}
              placeholder="오늘의 운동을 한 줄로 남겨주세요."
              aria-describedby="workout-title-count"
              className="resize-none border-b-2 border-[#00103D]/20 bg-transparent px-0 py-3 outline-none focus:border-[#05D082] disabled:opacity-60"
              disabled={pending}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                onTitleChange(event.currentTarget.value)
              }
            />
            <span className="text-right text-xs text-neutral-400">
              <span id="workout-title-count">{draft.title.length}</span>/100
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-neutral-800">추천 태그</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tags.map((tag, index) => (
                <Button
                  key={tag}
                  type="button"
                  size="plain"
                  disabled={pending}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-2 text-sm font-semibold disabled:opacity-60",
                    index === 0
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                  )}
                  onClick={() => onAppendTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-neutral-800">오운완 이미지</span>
            <input
              ref={fileInputRef}
              id="workout-image-input"
              name="image"
              type="file"
              accept="image/*"
              capture="environment"
              aria-label="오운완 이미지 선택"
              className="sr-only"
              tabIndex={-1}
              disabled={pending}
              onChange={onFileChange}
            />

            {draft.imagePreviewUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100">
                <img
                  src={draft.imagePreviewUrl}
                  alt="선택한 오운완 이미지 미리보기"
                  className="h-full w-full object-cover"
                />
                <Button
                  type="button"
                  size="plain"
                  disabled={pending}
                  className="absolute right-3 top-3 rounded-full bg-neutral-900/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-neutral-900 disabled:opacity-60"
                  onClick={onRemoveImage}
                >
                  사진 삭제
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="plain"
                disabled={pending}
                className={cn(
                  "flex aspect-[4/3] w-full flex-col items-center justify-center gap-0 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#05D082]/30 focus-visible:ring-offset-2 disabled:opacity-60",
                  pending
                    ? "cursor-not-allowed"
                    : "cursor-pointer hover:border-neutral-400 hover:bg-neutral-100",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 text-3xl text-neutral-800">
                  +
                </span>
                <span className="font-semibold text-neutral-700">오운완 사진 추가</span>
                <span className="mt-1 text-xs text-neutral-400">
                  선택 사항 · 최대 1장
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-100 bg-white px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:w-full md:border-0 md:px-0 md:pb-0 md:pt-0">
          <Button
            type="submit"
            size="plain"
            fullWidth
            loading={pending}
            disabled={pending}
            className="rounded-xl bg-neutral-800/95 px-4 py-3 font-semibold text-white hover:bg-neutral-800/90 disabled:opacity-60"
          >
            {pending ? "퇴실 처리 중..." : "기록하고 퇴실하기"}
          </Button>

          <div className="flex w-full flex-row gap-2">
            <Button
              type="button"
              size="plain"
              fullWidth
              variant="secondary"
              disabled={pending}
              className="rounded-xl bg-neutral-100 px-3 py-3 font-semibold text-neutral-700 hover:bg-neutral-200/80 disabled:opacity-60"
              onClick={onCancel}
            >
              취소
            </Button>
            <Button
              type="button"
              size="plain"
              fullWidth
              variant="danger"
              loading={pending}
              disabled={pending}
              className="rounded-xl bg-red-50 px-3 py-3 font-semibold text-red-500 hover:bg-red-100 disabled:opacity-60"
              onClick={onSkipRecord}
            >
              기록하지 않고 퇴실
            </Button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}
