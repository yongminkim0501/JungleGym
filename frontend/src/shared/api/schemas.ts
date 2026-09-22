import { z } from "zod";

const dataUrlPrefixPattern = /^data:image\/[^;,]+;base64,/i;
const maxImageDataUrlChars = 14_000_000;
const maxDecodedImageBytes = 10 * 1024 * 1024;

function decodedBase64Bytes(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) return Number.POSITIVE_INFINITY;

  const base64 = dataUrl.slice(commaIndex + 1).replace(/\s/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;

  return Math.floor((base64.length * 3) / 4) - padding;
}

export const wireErrorSchema = z.object({
  success: z.literal(false),
  code: z.string().optional(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
  timestamp: z.string().optional(),
});

export function wireSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  nickname: z.string(),
  name: z.string(),
  profileImageUrl: z.string().nullable(),
});

export const verificationSchema = z.object({
  ticket: z.string(),
  email: z.string(),
  name: z.string().nullable(),
});

export const visitSchema = z.object({
  id: z.number(),
  checkedInAt: z.string(),
  checkedOutAt: z.string().nullable(),
  title: z.string(),
  imageUrl: z.string().nullable(),
});

export const historySchema = z.object({
  content: z.array(visitSchema),
  page: z.number(),
  totalPages: z.number(),
  totalElements: z.number(),
});

export const workoutSchema = z.object({
  title: z.string(),
  imageUrl: z.string().nullable(),
  checkedInAt: z.string(),
});

export const dashboardSchema = z.object({
  user: z.object({
    nickname: z.string(),
    email: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
  checkedIn: z.boolean(),
  currentVisitors: z.number(),
  capacity: z.number(),
  monthlyAttendance: z.number(),
  streakDays: z.number(),
  attendanceDays: z.array(z.number()),
  recentWorkout: workoutSchema.nullable(),
  workoutCount: z.number(),
  weeklyVisits: z.array(z.number()).length(7),
  workoutEvents: z.record(z.string(), workoutSchema),
});

export const calendarRequestSchema = z
  .object({
    year: z.number().int().min(1).max(9999),
    month: z.number().int().min(1).max(12),
  })
  .strict();

export const attendanceCalendarDaySchema = z
  .object({
    date: z.number().int().min(1).max(31),
    ischeck: z.boolean(),
    title: z.string(),
    img_url: z.string(),
  })
  .strict();

export const attendanceCalendarSchema = z.array(attendanceCalendarDaySchema);

export const attendanceDaySchema = z
  .object({
    date: z.number().int().min(1).max(31),
    title: z.string(),
    img_url: z.string(),
  })
  .strict();

export const attendanceDaysSchema = z.array(attendanceDaySchema);

export const registerPayloadSchema = z.object({
  email: z.string().email(),
  jungleNumber: z.string().trim().min(1).max(50),
  nickname: z.string().min(4).max(25),
  name: z.string().min(1).max(50),
  password: z.string().min(8).max(72),
});

export const loginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const recoveryPurposeSchema = z.enum([
  "SIGN_UP",
  "FIND_ID",
  "RESET_PASSWORD",
]);

export const sendCodePayloadSchema = z.object({
  email: z.string().email(),
  purpose: recoveryPurposeSchema,
});

export const verifyCodePayloadSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: recoveryPurposeSchema,
});

export const resetPasswordPayloadSchema = z.object({
  ticket: z.string().min(1),
  password: z.string().min(8).max(72),
});

export const checkOutPayloadSchema = z
  .object({
    title: z.string().max(100).optional(),
    image: z
      .string()
      .max(maxImageDataUrlChars)
      .refine(
        (value) => value === "" || dataUrlPrefixPattern.test(value),
        "INVALID_IMAGE",
      )
      .refine(
        (value) =>
          value === "" || decodedBase64Bytes(value) <= maxDecodedImageBytes,
        "INVALID_IMAGE",
      )
      .optional(),
  })
  .strict();

export const nullSchema = z.null();
export const csrfSchema = z.string();

export const visitHistorySchema = z.object({
  visits: z.array(visitSchema),
  page: z.number(),
  totalPages: z.number(),
  totalElements: z.number(),
});
