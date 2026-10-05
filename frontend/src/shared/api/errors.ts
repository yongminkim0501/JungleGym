export type ApiFieldErrors = Record<string, string>;

export type ApiErrorOptions = {
  status: number;
  message: string;
  code?: string;
  fieldErrors?: ApiFieldErrors;
  timestamp?: string;
  requestId?: string;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: ApiFieldErrors;
  readonly timestamp?: string;
  readonly requestId?: string;

  constructor(options: ApiErrorOptions) {
    // Server failures show a short request ID so a user report can be matched to the server log.
    super(
      options.requestId && options.status >= 500
        ? `${options.message} (요청 ID: ${options.requestId.slice(0, 8)})`
        : options.message,
    );
    this.name = "ApiError";
    this.status = options.status;

    if (options.code !== undefined) this.code = options.code;
    if (options.fieldErrors !== undefined)
      this.fieldErrors = options.fieldErrors;
    if (options.timestamp !== undefined) this.timestamp = options.timestamp;
    if (options.requestId !== undefined) this.requestId = options.requestId;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
