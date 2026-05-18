// src/lib/__tests__/api.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/msw/server';

// Lazy import to ensure module is fresh per test
async function freshApi() {
  vi.resetModules();
  return (await import('../api')).api;
}

describe('api with refresh interceptor', () => {
  beforeEach(() => server.resetHandlers());

  it('retries the original request after a successful refresh on 401', async () => {
    let call = 0;
    server.use(
      http.get('/api/evaluations', () => {
        call += 1;
        return call === 1
          ? HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
          : HttpResponse.json({ items: [], nextCursor: null });
      }),
      http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 204 })),
    );

    const api = await freshApi();
    const r = await api.get('/evaluations');
    expect(r.status).toBe(200);
    expect(call).toBe(2);
  });

  it('does not retry if refresh also fails', async () => {
    server.use(
      http.get('/api/evaluations', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })),
      http.post('/api/auth/refresh', () => HttpResponse.json({ error: {} }, { status: 401 })),
    );
    const api = await freshApi();
    await expect(api.get('/evaluations')).rejects.toThrowError();
  });

  it('shares a single refresh call across concurrent 401s', async () => {
    let refreshCalls = 0;
    let firstAttempts = { a: 0, b: 0 };
    server.use(
      http.get('/api/a', () => {
        firstAttempts.a += 1;
        return firstAttempts.a === 1
          ? HttpResponse.json({}, { status: 401 })
          : HttpResponse.json({ ok: 'a' });
      }),
      http.get('/api/b', () => {
        firstAttempts.b += 1;
        return firstAttempts.b === 1
          ? HttpResponse.json({}, { status: 401 })
          : HttpResponse.json({ ok: 'b' });
      }),
      http.post('/api/auth/refresh', () => {
        refreshCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const api = await freshApi();
    const [a, b] = await Promise.all([api.get('/a'), api.get('/b')]);
    expect(a.data).toEqual({ ok: 'a' });
    expect(b.data).toEqual({ ok: 'b' });
    expect(refreshCalls).toBe(1);
  });

  it('does not refresh on non-401 errors', async () => {
    let refreshCalls = 0;
    server.use(
      http.get('/api/x', () => HttpResponse.json({}, { status: 500 })),
      http.post('/api/auth/refresh', () => { refreshCalls += 1; return new HttpResponse(null, { status: 204 }); }),
    );
    const api = await freshApi();
    await expect(api.get('/x')).rejects.toThrowError();
    expect(refreshCalls).toBe(0);
  });

  it('does not refresh when the failing request is on an /auth/ path', async () => {
    let refreshCalls = 0;
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })),
      http.post('/api/auth/refresh', () => { refreshCalls += 1; return new HttpResponse(null, { status: 204 }); }),
    );
    const api = await freshApi();
    await expect(api.post('/auth/login', { email: 'a@b.com', password: 'x' })).rejects.toThrowError();
    expect(refreshCalls).toBe(0);
  });
});
