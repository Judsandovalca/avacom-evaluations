// src/http/middleware/__tests__/authMiddleware.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../authMiddleware';
import { errorHandler } from '../errorHandler';
import type { TokenService } from '../../../domain/auth/TokenService';

function makeTokens(
  payload: { userId: string; email: string } | null = { userId: 'u-1', email: 'a@b.com' },
  throwErr = false,
): TokenService {
  return {
    signPair: vi.fn(),
    signAccess: vi.fn(),
    verifyAccess: vi.fn().mockImplementation(async () => {
      if (throwErr) throw new Error('bad');
      if (!payload) throw new Error('no payload');
      return payload;
    }),
    verifyRefresh: vi.fn(),
  } as unknown as TokenService;
}

function makeApp(tokens: TokenService) {
  const app = new Hono<{ Variables: { userId: string; userEmail: string } }>();
  app.onError(errorHandler);
  app.use('*', authMiddleware(tokens));
  app.get('/test', (c) => c.json({ userId: c.get('userId'), email: c.get('userEmail') }));
  return app;
}

describe('authMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets userId and userEmail when token valid', async () => {
    const app = makeApp(makeTokens());
    const r = await app.request('/test', { headers: { Cookie: 'access_token=AT' } });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ userId: 'u-1', email: 'a@b.com' });
  });

  it('returns 401 when no cookie', async () => {
    const r = await makeApp(makeTokens()).request('/test');
    expect(r.status).toBe(401);
  });

  it('returns 401 when access_token cookie absent', async () => {
    const r = await makeApp(makeTokens()).request('/test', { headers: { Cookie: 'other=x' } });
    expect(r.status).toBe(401);
  });

  it('returns 401 when token verification fails', async () => {
    const r = await makeApp(makeTokens(null, true)).request('/test', {
      headers: { Cookie: 'access_token=BAD' },
    });
    expect(r.status).toBe(401);
  });

  it('passes through Cookie parsing with quoted values', async () => {
    const r = await makeApp(makeTokens()).request('/test', {
      headers: { Cookie: 'access_token="AT"' },
    });
    expect(r.status).toBe(200);
  });
});
