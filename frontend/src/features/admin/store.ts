"use client";

import { useSyncExternalStore } from "react";
import { dataSchema, initialData, type AdminData } from "./model";

const storageKey = "junglegym:local-admin:v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let snapshot = initialData;
let notice = "";

function getSnapshot() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = raw ? dataSchema.safeParse(JSON.parse(raw)) : null;
      snapshot = parsed?.success ? parsed.data : initialData;
      notice =
        parsed && !parsed.success
          ? "저장된 데이터 형식이 달라 예시 데이터를 표시합니다."
          : "";
    }
  } catch {
    snapshot = initialData;
    notice = "브라우저 저장소를 읽을 수 없어 예시 데이터를 표시합니다.";
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
export function useAdminData() {
  const data = useSyncExternalStore(subscribe, getSnapshot, () => initialData);
  return { data, notice };
}
export function saveAdminData(update: (current: AdminData) => AdminData) {
  const next = dataSchema.parse(update(getSnapshot()));
  // Save before publishing so a failed write never looks like a successful edit.
  const raw = JSON.stringify(next);
  localStorage.setItem(storageKey, raw);
  snapshot = next;
  cachedRaw = raw;
  notice = "";
  listeners.forEach((listener) => listener());
}
