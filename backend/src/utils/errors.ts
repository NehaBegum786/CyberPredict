import type { Response } from "express";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function sendError(res: Response, error: unknown, fallbackStatus = 500): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
    return;
  }
  const msg = error instanceof Error ? error.message : "Internal server error";
  res.status(fallbackStatus).json({
    error: "InternalServerError",
    message: msg,
    statusCode: fallbackStatus,
  });
}
