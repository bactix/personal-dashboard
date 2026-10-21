export type ApiErrorCode =
  | "network"
  | "timeout"
  | "http"
  | "invalid-response"
  | "config";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;

  constructor(
    message: string,
    code: ApiErrorCode,
    options: { status?: number; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.code = code;
    this.status = options.status;
  }

  /** Transient failures worth retrying; client errors (4xx) and bad data are not. */
  get retryable(): boolean {
    if (this.code === "network" || this.code === "timeout") return true;
    if (this.code === "http") {
      return this.status === 429 || (this.status !== undefined && this.status >= 500);
    }
    return false;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Text to show for a failed request: our own routes send readable messages for 4xx
 * (validation, "not found", "in use"), so show those; hide anything else behind `fallback`.
 */
export function userMessage(error: unknown, fallback: string): string {
  return isApiError(error) && error.status !== undefined && error.status < 500
    ? error.message
    : fallback;
}
