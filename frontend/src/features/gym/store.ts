"use client";

import { create } from "zustand";

export type GymDialog = "check-in" | "check-out" | "workout" | null;

type GymDraft = {
  title: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
};

type GymWorkflowState = {
  dialog: GymDialog;
  pending: boolean;
  checkInError: string | null;
  checkOutError: string | null;
  workoutError: string | null;
  draft: GymDraft;
  openCheckIn: () => void;
  openCheckOut: () => void;
  openWorkout: () => void;
  closeDialog: () => void;
  beginPending: () => boolean;
  endPending: () => void;
  setCheckInError: (message: string | null) => void;
  setCheckOutError: (message: string | null) => void;
  setWorkoutError: (message: string | null) => void;
  setTitle: (title: string) => void;
  setImageFile: (imageFile: File | null, imagePreviewUrl: string | null) => void;
  appendTag: (tag: string) => void;
  resetWorkoutDraft: () => void;
  resetWorkflow: () => void;
};

function createInitialDraft(): GymDraft {
  return {
    title: "",
    imageFile: null,
    imagePreviewUrl: null,
  };
}

function revokePreviewUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export const useGymWorkflowStore = create<GymWorkflowState>((set, get) => ({
  dialog: null,
  pending: false,
  checkInError: null,
  checkOutError: null,
  workoutError: null,
  draft: createInitialDraft(),
  openCheckIn: () => {
    if (get().pending) return;
    set({ dialog: "check-in", checkInError: null });
  },
  openCheckOut: () => {
    if (get().pending) return;
    set({ dialog: "check-out", checkOutError: null });
  },
  openWorkout: () => {
    if (get().pending) return;
    set({ dialog: "workout", checkOutError: null, workoutError: null });
  },
  closeDialog: () => {
    if (get().pending) return;
    set({ dialog: null, checkInError: null, checkOutError: null });
  },
  beginPending: () => {
    if (get().pending) return false;
    set({ pending: true });
    return true;
  },
  endPending: () => set({ pending: false }),
  setCheckInError: (message) => set({ checkInError: message }),
  setCheckOutError: (message) => set({ checkOutError: message }),
  setWorkoutError: (message) => set({ workoutError: message }),
  setTitle: (title) =>
    set((state) => ({
      draft: {
        ...state.draft,
        title: title.slice(0, 100),
      },
      workoutError: null,
    })),
  setImageFile: (imageFile, imagePreviewUrl) => {
    if (get().pending) return;

    set((state) => {
      revokePreviewUrl(state.draft.imagePreviewUrl);
      return {
        draft: {
          ...state.draft,
          imageFile,
          imagePreviewUrl,
        },
        workoutError: null,
      };
    });
  },
  appendTag: (tag) =>
    set((state) => {
      if (state.pending) return state;

      const trimmedTitle = state.draft.title.trim();
      const parts = trimmedTitle ? trimmedTitle.split(/\s+/) : [];

      if (parts.includes(tag)) return state;

      const nextTitle = trimmedTitle ? `${trimmedTitle} ${tag}` : tag;

      if (nextTitle.length > 100) {
        return {
          workoutError: "제목은 100자 이하로 입력해주세요.",
        };
      }

      return {
        draft: {
          ...state.draft,
          title: nextTitle,
        },
        workoutError: null,
      };
    }),
  resetWorkoutDraft: () => {
    if (get().pending) return;

    set((state) => {
      revokePreviewUrl(state.draft.imagePreviewUrl);
      return {
        draft: createInitialDraft(),
        workoutError: null,
      };
    });
  },
  resetWorkflow: () =>
    set((state) => {
      revokePreviewUrl(state.draft.imagePreviewUrl);
      return {
        dialog: null,
        pending: false,
        checkInError: null,
        checkOutError: null,
        workoutError: null,
        draft: createInitialDraft(),
      };
    }),
}));

export function resetGymWorkflow() {
  useGymWorkflowStore.getState().resetWorkflow();
}
