"use client";

import { CheckInDialog } from "./CheckInDialog";
import { CheckOutDialog } from "./CheckOutDialog";
import { useGymWorkflow, workoutTags } from "./useGymWorkflow";
import { WorkoutRecordSheet } from "./WorkoutRecordSheet";

export function GymDialogs() {
  const workflow = useGymWorkflow();

  return (
    <>
      <CheckInDialog
        open={workflow.dialog === "check-in"}
        pending={workflow.pending}
        error={workflow.checkInError}
        now={workflow.now}
        onOpenChange={workflow.handleDialogChange}
        onConfirm={() => void workflow.handleCheckIn()}
        onCancel={workflow.closeDialog}
      />

      <CheckOutDialog
        open={workflow.dialog === "check-out"}
        pending={workflow.pending}
        error={workflow.checkOutError}
        now={workflow.now}
        onOpenChange={workflow.handleDialogChange}
        onConfirm={workflow.handleOpenWorkout}
        onCancel={workflow.closeDialog}
      />

      <WorkoutRecordSheet
        open={workflow.dialog === "workout"}
        pending={workflow.pending}
        error={workflow.workoutError}
        draft={workflow.draft}
        tags={workoutTags}
        onOpenChange={(open) => {
          if (!open) workflow.handleDismissWorkout();
        }}
        onSubmit={workflow.handleWorkoutSubmit}
        onTitleChange={workflow.setTitle}
        onAppendTag={workflow.appendTag}
        onFileChange={workflow.handleFileChange}
        onRemoveImage={workflow.removeImage}
        onCancel={workflow.handleDismissWorkout}
        onSkipRecord={workflow.skipWorkoutRecord}
      />
    </>
  );
}
