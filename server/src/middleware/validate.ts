import type { NextFunction, Request, Response } from "express";
import { z, type ZodTypeAny } from "zod";
import { AppError } from "../utils/errors.js";

export function parseWith<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw toValidationError(result.error);
  }
  return result.data;
}

function toValidationError(error: z.ZodError): AppError {
  const message = error.issues.map((issue) => issue.message).join("; ") || "Invalid request";
  return new AppError("VALIDATION_ERROR", message, 400);
}

export function validateQuery<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      parseWith(schema, req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = parseWith(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      parseWith(schema, req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}
