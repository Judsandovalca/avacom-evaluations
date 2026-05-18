// src/http/middleware/__tests__/errorHandler.test.ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { errorHandler } from '../errorHandler';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
  DomainError,
} from '../../../domain/errors';

function makeApp(throwErr: Error) {
  const app = new Hono();
  app.onError(errorHandler);
  app.get('/x', () => {
    throw throwErr;
  });
  return app;
}

describe('errorHandler', () => {
  it.each([
    [new ValidationError('bad'), 400, 'VALIDATION_ERROR'],
    [new UnauthorizedError('au'), 401, 'UNAUTHORIZED'],
    [new ForbiddenError('no'), 403, 'FORBIDDEN'],
    [new NotFoundError('x'), 404, 'NOT_FOUND'],
    [new ConflictError('dup'), 409, 'CONFLICT'],
  ])('maps %s to status %d code %s', async (err, status, code) => {
    const r = await makeApp(err as Error).request('/x');
    expect(r.status).toBe(status);
    expect(await r.json()).toMatchObject({ error: { code, message: (err as Error).message } });
  });

  it('maps unknown DomainError to 500 INTERNAL_ERROR', async () => {
    const r = await makeApp(new DomainError('SOMETHING', 'oops')).request('/x');
    expect(r.status).toBe(500);
  });

  it('maps generic Error to 500 INTERNAL_ERROR (hides message)', async () => {
    const r = await makeApp(new Error('private')).request('/x');
    expect(r.status).toBe(500);
    expect(await r.json()).toMatchObject({ error: { code: 'INTERNAL_ERROR' } });
    expect(await (await makeApp(new Error('private')).request('/x')).text()).not.toContain('private');
  });

  it('includes ValidationError details in response', async () => {
    const r = await makeApp(new ValidationError('bad', { field: 'title' })).request('/x');
    expect(((await r.json()) as { error: { details: unknown } }).error.details).toEqual({
      field: 'title',
    });
  });
});
