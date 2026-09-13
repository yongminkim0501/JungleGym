import type { z } from "zod";

import type {
  checkOutPayloadSchema,
  dashboardSchema,
  historySchema,
  loginPayloadSchema,
  recoveryPurposeSchema,
  registerPayloadSchema,
  resetPasswordPayloadSchema,
  sendCodePayloadSchema,
  userSchema,
  verificationSchema,
  verifyCodePayloadSchema,
  visitHistorySchema,
  visitSchema,
  wireErrorSchema,
  wireSuccessSchema,
  workoutSchema,
} from "./schemas";

export type WireSuccess<T> = z.infer<
  ReturnType<typeof wireSuccessSchema<z.ZodType<T>>>
>;
export type WireErrorDto = z.infer<typeof wireErrorSchema>;

export type UserDto = z.infer<typeof userSchema>;
export type VerificationDto = z.infer<typeof verificationSchema>;
export type VisitDto = z.infer<typeof visitSchema>;
export type HistoryDto = z.infer<typeof historySchema>;
export type WorkoutDto = z.infer<typeof workoutSchema>;
export type DashboardDto = z.infer<typeof dashboardSchema>;
export type VisitHistory = z.infer<typeof visitHistorySchema>;

export type RecoveryPurpose = z.infer<typeof recoveryPurposeSchema>;
export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
export type LoginPayload = z.infer<typeof loginPayloadSchema>;
export type SendCodePayload = z.infer<typeof sendCodePayloadSchema>;
export type VerifyCodePayload = z.infer<typeof verifyCodePayloadSchema>;
export type ResetPasswordPayload = z.infer<typeof resetPasswordPayloadSchema>;
export type CheckOutPayload = z.infer<typeof checkOutPayloadSchema>;

export type VisitsRequest = {
  page?: number | undefined;
  size?: number | undefined;
  signal?: AbortSignal | undefined;
};

export type User = UserDto;
export type Verification = VerificationDto;
export type Visit = VisitDto;
export type History = HistoryDto;
export type Workout = WorkoutDto;
export type Dashboard = DashboardDto;
