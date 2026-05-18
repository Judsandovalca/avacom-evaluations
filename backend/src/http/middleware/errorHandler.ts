// src/http/middleware/errorHandler.ts
import type { Context, ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import {
  DomainError,
  ValidationError,
} from '../../domain/errors';

const STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: err.flatten(),
        },
      },
      400,
    );
  }

  if (err instanceof ValidationError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: err.message,
          details: err.details,
        },
      },
      400,
    );
  }

  if (err instanceof DomainError) {
    const status = (STATUS_MAP[err.code] ?? 500) as ContentfulStatusCode;
    return c.json({ error: { code: err.code, message: err.message } }, status);
  }

  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    500,
  );
};
