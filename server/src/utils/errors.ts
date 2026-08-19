export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly expose: boolean;

  constructor(code: string, message: string, statusCode = 500, expose = true) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.expose = expose;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
