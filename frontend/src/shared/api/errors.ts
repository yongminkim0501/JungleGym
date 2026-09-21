export type ApiFieldErrors = Record<string, string>;

export type ApiErrorOptions = {
  status: number;
  message: string;
  code?: string;
  fieldErrors?: ApiFieldErrors;
  timestamp?: string;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: ApiFieldErrors;
  readonly timestamp?: string;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;

    if (options.code !== undefined) this.code = options.code;
    if (options.fieldErrors !== undefined)
      this.fieldErrors = options.fieldErrors;
    if (options.timestamp !== undefined) this.timestamp = options.timestamp;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
