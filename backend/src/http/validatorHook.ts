// src/http/validatorHook.ts
import type { Hook } from '@hono/zod-validator';

/**
 * zValidator hook that rethrows ZodError instances so the centralized
 * errorHandler can format the response. Keeps validation responses
 * consistent across all routes ({ error: { code: 'VALIDATION_ERROR', ... } }).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throwOnInvalid: Hook<any, any, any, any> = (result) => {
  if (!result.success) {
    throw result.error;
  }
};
