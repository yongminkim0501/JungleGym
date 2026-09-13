"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/entities";
import { api } from "@/shared/api";

import { resetGymWorkflow, useGymWorkflowStore } from "./store";
import {
  apiErrorMessage,
  currentKoreanTime,
  isApiErrorCode,
  makeCheckOutPayload,
  validateImageFileForSelection,
} from "./utils";

export const workoutTags = ["#오운완", "#상체", "#하체", "#유산소", "#스트레칭"];

export function useGymWorkflow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);

  const dialog = useGymWorkflowStore((state) => state.dialog);
  const pending = useGymWorkflowStore((state) => state.pending);
  const checkInError = useGymWorkflowStore((state) => state.checkInError);
  const checkOutError = useGymWorkflowStore((state) => state.checkOutError);
  const workoutError = useGymWorkflowStore((state) => state.workoutError);
  const draft = useGymWorkflowStore((state) => state.draft);
  const closeDialog = useGymWorkflowStore((state) => state.closeDialog);
  const openWorkout = useGymWorkflowStore((state) => state.openWorkout);
  const beginPending = useGymWorkflowStore((state) => state.beginPending);
  const endPending = useGymWorkflowStore((state) => state.endPending);
  const setCheckInError = useGymWorkflowStore((state) => state.setCheckInError);
  const setCheckOutError = useGymWorkflowStore((state) => state.setCheckOutError);
  const setWorkoutError = useGymWorkflowStore((state) => state.setWorkoutError);
  const setTitle = useGymWorkflowStore((state) => state.setTitle);
  const setImageFile = useGymWorkflowStore((state) => state.setImageFile);
  const appendTag = useGymWorkflowStore((state) => state.appendTag);
  const resetWorkoutDraft = useGymWorkflowStore((state) => state.resetWorkoutDraft);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      resetGymWorkflow();
    };
  }, []);

  const isMounted = () => mountedRef.current;


  async function invalidateGymState() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.visits }),
    ]);
  }

  function handleDialogChange(open: boolean) {
    if (!open) closeDialog();
  }

  async function handleCheckIn() {
    if (!beginPending()) return;
    setCheckInError(null);

    try {
      await api.checkIn();
      if (!isMounted()) return;
      await invalidateGymState();
      if (!isMounted()) return;
      endPending();
      closeDialog();
      router.push("/qr/success?type=check-in");
    } catch (error) {
      if (!isMounted()) return;

      if (isApiErrorCode(error, "ALREADY_CHECKED_IN")) {
        await invalidateGymState();
        if (!isMounted()) return;
      }

      setCheckInError(apiErrorMessage(error, "입실 처리에 실패했습니다."));
    } finally {
      if (isMounted()) endPending();
    }
  }

  function handleOpenWorkout() {
    setCheckOutError(null);
    openWorkout();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    input.value = "";

    if (!file) return;

    const validationMessage = validateImageFileForSelection(file);
    if (validationMessage) {
      setWorkoutError(validationMessage);
      return;
    }

    setImageFile(file, URL.createObjectURL(file));
  }

  async function submitCheckOut(skipRecord = false) {
    if (!beginPending()) return;
    setWorkoutError(null);

    try {
      const payload = skipRecord
        ? {}
        : await makeCheckOutPayload(draft.title, draft.imageFile);

      if (!isMounted()) return;
      await api.checkOut(payload);
      if (!isMounted()) return;
      await invalidateGymState();
      if (!isMounted()) return;
      endPending();
      resetWorkoutDraft();
      closeDialog();
      router.push("/qr/success?type=check-out");
    } catch (error) {
      if (!isMounted()) return;

      if (isApiErrorCode(error, "NOT_CHECKED_IN")) {
        await invalidateGymState();
        if (!isMounted()) return;
      }

      setWorkoutError(apiErrorMessage(error, "퇴실 처리에 실패했습니다."));
    } finally {
      if (isMounted()) endPending();
    }
  }

  function handleWorkoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitCheckOut(false);
  }

  function handleDismissWorkout() {
    resetWorkoutDraft();
    closeDialog();
  }

  return {
    dialog,
    pending,
    checkInError,
    checkOutError,
    workoutError,
    draft,
    now: currentKoreanTime(),
    appendTag,
    closeDialog,
    handleCheckIn,
    handleDialogChange,
    handleDismissWorkout,
    handleFileChange,
    handleOpenWorkout,
    handleWorkoutSubmit,
    removeImage: () => setImageFile(null, null),
    setTitle,
    skipWorkoutRecord: () => void submitCheckOut(true),
  };
}
