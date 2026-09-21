"use client";

import type { ApiError } from "@/shared/api";

export type CheckOutPayload = {
  title?: string;
  image?: string;
};

const DATA_URL_MAX_CHARS = 14_000_000;
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export function currentKoreanTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
    hour12: true,
  }).format(new Date());
}

export function apiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as Partial<ApiError> | undefined;
  return apiError?.message || fallback;
}

export function isApiErrorCode(error: unknown, code: string) {
  const apiError = error as Partial<ApiError> | undefined;
  return apiError?.code === code;
}

export function validateImageFileForSelection(file: File) {
  if (file.type && !file.type.startsWith("image/")) {
    return "이미지 파일만 선택할 수 있습니다.";
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return "이미지는 최대 10MiB 이하로 선택해주세요.";
  }

  return null;
}

export async function makeCheckOutPayload(
  title: string,
  imageFile: File | null,
): Promise<CheckOutPayload> {
  const payload: CheckOutPayload = {};
  const normalizedTitle = title.trim();

  if (normalizedTitle) payload.title = normalizedTitle;
  if (!imageFile) return payload;

  const dataUrl = await readFileAsDataUrl(imageFile);
  assertDataUrlSize(dataUrl);
  payload.image = dataUrl;

  return payload;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("이미지 파일을 읽지 못했습니다."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("이미지 파일을 읽지 못했습니다."));
    };

    reader.readAsDataURL(file);
  });
}

function assertDataUrlSize(dataUrl: string) {
  if (dataUrl.length > DATA_URL_MAX_CHARS) {
    throw new Error("이미지는 최대 10MiB 이하로 선택해주세요.");
  }

  const commaIndex = dataUrl.indexOf(",");
  const body = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
  const decodedBytes = Math.floor((body.length * 3) / 4) - padding;

  if (decodedBytes > IMAGE_MAX_BYTES) {
    throw new Error("이미지는 최대 10MiB 이하로 선택해주세요.");
  }
}
