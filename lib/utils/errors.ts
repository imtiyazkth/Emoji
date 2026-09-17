/**
 * Central, typed error model. All API routes catch into this shape so
 * the frontend never has to guess response format, and so we never leak
 * stack traces / internal details to public clients.
 */

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_TIMEOUT: "AI_TIMEOUT",
  AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR",
  CACHE_ERROR: "CACHE_ERROR",
  GITHUB_READ_ERROR: "GITHUB_READ_ERROR",
  GITHUB_WRITE_ERROR: "GITHUB_WRITE_ERROR",
  IMAGE_TOO_LARGE: "IMAGE_TOO_LARGE",
  INVALID_IMAGE: "INVALID_IMAGE",
  MODERATION_BLOCKED: "MODERATION_BLOCKED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  code: ErrorCodeType;
  retryable: boolean;
  status: number;

  constructor(code: ErrorCodeType, message: string, opts?: { retryable?: boolean; status?: number }) {
    super(message);
    this.code = code;
    this.retryable = opts?.retryable ?? false;
    this.status = opts?.status ?? 500;
  }
}

export function errorResponseBody(err: unknown, requestId: string) {
  if (err instanceof AppError) {
    return {
      success: false as const,
      error: { code: err.code, message: err.message, retryable: err.retryable },
      requestId,
    };
  }
  // Never leak internal error details for unexpected exceptions.
  return {
    success: false as const,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Something went wrong. Please try again.",
      retryable: true,
    },
    requestId,
  };
}

export function statusFor(err: unknown): number {
  return err instanceof AppError ? err.status : 500;
}

export function newRequestId(): string {
  return "req_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
