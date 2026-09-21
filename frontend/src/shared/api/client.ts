import { z } from "zod";

import { ApiError } from "./errors";
import {
  checkOutPayloadSchema,
  csrfSchema,
  dashboardSchema,
  historySchema,
  loginPayloadSchema,
  nullSchema,
  registerPayloadSchema,
  resetPasswordPayloadSchema,
  sendCodePayloadSchema,
  userSchema,
  verificationSchema,
  verifyCodePayloadSchema,
  visitSchema,
  wireErrorSchema,
  wireSuccessSchema,
} from "./schemas";
import type {
  CheckOutPayload,
  DashboardDto,
  HistoryDto,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SendCodePayload,
  UserDto,
  VerificationDto,
  VerifyCodePayload,
  VisitDto,
  VisitsRequest,
} from "./types";

type RequestOptions = {
  signal?: AbortSignal | undefined;
};

let csrfPromise: Promise<string> | null = null;

function statusMessage(status: number) {
  if (status === 401) return "로그인이 필요합니다.";
  if (status === 403) return "요청 권한이 없습니다.";
  if (status === 413) return "요청 본문이 너무 큽니다.";
  if (status === 429) return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if (status === 502) return "백엔드 응답을 처리할 수 없습니다.";
  if (status === 503) return "서버와 연결할 수 없습니다.";
  if (status >= 500) return "서버 오류가 발생했습니다.";

  return "요청 처리에 실패했습니다.";
}

function isJsonResponse(response: Response) {
  return (
    response.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json") === true
  );
}

async function readError(response: Response): Promise<ApiError> {
  if (isJsonResponse(response)) {
    const raw = await response.json().catch(() => null);
    const wireError = wireErrorSchema.safeParse(raw);

    if (wireError.success) {
      return apiErrorFromWire(response.status, wireError.data);
    }

    if (
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
    ) {
      return new ApiError({
        status: response.status,
        message: raw.message,
      });
    }
  }

  await response.body?.cancel().catch(() => undefined);

  return new ApiError({
    status: response.status,
    message: statusMessage(response.status),
  });
}

function apiErrorFromWire(
  status: number,
  wireError: z.infer<typeof wireErrorSchema>,
) {
  const options = {
    status,
    message: wireError.message,
  } satisfies ConstructorParameters<typeof ApiError>[0];

  if (wireError.code !== undefined) {
    Object.assign(options, { code: wireError.code });
  }
  if (wireError.fieldErrors !== undefined) {
    Object.assign(options, { fieldErrors: wireError.fieldErrors });
  }
  if (wireError.timestamp !== undefined) {
    Object.assign(options, { timestamp: wireError.timestamp });
  }

  return new ApiError(options);
}

async function parseSuccess<T>(
  response: Response,
  dataSchema: z.ZodType<T>,
): Promise<T> {
  if (!response.ok) {
    throw await readError(response);
  }

  const raw = await response.json().catch((cause) => {
    throw new ApiError({
      status: response.status,
      message: "응답을 JSON으로 해석할 수 없습니다.",
      cause,
    });
  });

  const parsed = wireSuccessSchema(dataSchema).safeParse(raw);

  if (!parsed.success) {
    const parsedError = wireErrorSchema.safeParse(raw);
    if (parsedError.success) {
      throw apiErrorFromWire(response.status, parsedError.data);
    }

    throw new ApiError({
      status: response.status,
      message: "API 응답 형식이 올바르지 않습니다.",
      cause: parsed.error,
    });
  }

  return parsed.data.data;
}

async function requestGet<T>(
  path: string,
  dataSchema: z.ZodType<T>,
  options: RequestOptions = {},
) {
  const init: RequestInit = {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-store",
    },
  };

  if (options.signal !== undefined) {
    init.signal = options.signal;
  }

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;

    throw new ApiError({
      status: 503,
      message: "서버와 연결할 수 없습니다.",
      cause: error,
    });
  }

  return parseSuccess(response, dataSchema);
}

async function getCsrf(options: RequestOptions = {}) {
  options.signal?.throwIfAborted();
  if (!csrfPromise) {
    // A caller may cancel its own wait, but must not cancel the shared token request.
    csrfPromise = requestGet("/api/auth/csrf", csrfSchema).finally(() => {
      csrfPromise = null;
    });
  }

  const signal = options.signal;
  if (!signal) return csrfPromise;
  const tokenRequest = csrfPromise;

  return new Promise<string>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    tokenRequest.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
}

async function requestPost<TPayload, TResponse>(
  path: string,
  payload: TPayload | undefined,
  dataSchema: z.ZodType<TResponse>,
  options: RequestOptions = {},
) {
  const csrf = await getCsrf(options);
  const headers = new Headers({
    Accept: "application/json",
    "X-XSRF-TOKEN": csrf,
  });

  let body: string | undefined;
  if (payload !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(payload);
  }

  const init: RequestInit = {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers,
  };

  if (options.signal !== undefined) {
    init.signal = options.signal;
  }
  if (body !== undefined) {
    init.body = body;
  }

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;

    throw new ApiError({
      status: 503,
      message: "서버와 연결할 수 없습니다.",
      cause: error,
    });
  }

  return parseSuccess(response, dataSchema);
}

function visitsUrl(page: number, size: number) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return `/api/gym/visits?${params.toString()}`;
}

export const api = {
  getCsrf,

  me(options?: RequestOptions): Promise<UserDto> {
    return requestGet("/api/auth/me", userSchema, options);
  },

  login(payload: LoginPayload, options?: RequestOptions): Promise<UserDto> {
    return requestPost(
      "/api/auth/login",
      loginPayloadSchema.parse(payload),
      userSchema,
      options,
    );
  },

  register(
    payload: RegisterPayload,
    options?: RequestOptions,
  ): Promise<UserDto> {
    return requestPost(
      "/api/auth/register",
      registerPayloadSchema.parse(payload),
      userSchema,
      options,
    );
  },

  logout(options?: RequestOptions): Promise<null> {
    return requestPost("/api/auth/logout", undefined, nullSchema, options);
  },

  sendCode(payload: SendCodePayload, options?: RequestOptions): Promise<null> {
    return requestPost(
      "/api/recovery/send-code",
      sendCodePayloadSchema.parse(payload),
      nullSchema,
      options,
    );
  },

  verifyCode(
    payload: VerifyCodePayload,
    options?: RequestOptions,
  ): Promise<VerificationDto> {
    return requestPost(
      "/api/recovery/verify-code",
      verifyCodePayloadSchema.parse(payload),
      verificationSchema,
      options,
    );
  },

  resetPassword(
    payload: ResetPasswordPayload,
    options?: RequestOptions,
  ): Promise<null> {
    return requestPost(
      "/api/recovery/reset-password",
      resetPasswordPayloadSchema.parse(payload),
      nullSchema,
      options,
    );
  },

  checkIn(options?: RequestOptions): Promise<VisitDto> {
    return requestPost("/api/gym/check-in", undefined, visitSchema, options);
  },

  checkOut(
    payload: CheckOutPayload = {},
    options?: RequestOptions,
  ): Promise<VisitDto> {
    return requestPost(
      "/api/gym/check-out",
      checkOutPayloadSchema.parse(payload),
      visitSchema,
      options,
    );
  },

  visits({
    page = 0,
    size = 100,
    signal,
  }: VisitsRequest = {}): Promise<HistoryDto> {
    return requestGet(visitsUrl(page, size), historySchema, { signal });
  },

  dashboard(options?: RequestOptions): Promise<DashboardDto> {
    return requestGet("/api/dashboard", dashboardSchema, options);
  },
};
