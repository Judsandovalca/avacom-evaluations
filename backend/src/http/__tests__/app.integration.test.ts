// src/http/__tests__/app.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { buildApp } from '../app';
import { DynamoEvaluationRepository } from '../../adapters/persistence/DynamoEvaluationRepository';
import { DynamoUserRepository } from '../../adapters/persistence/DynamoUserRepository';
import { DynamoCourseRepository } from '../../adapters/persistence/DynamoCourseRepository';
import { JwtTokenService } from '../../adapters/auth/JwtTokenService';
import { BcryptHasher } from '../../adapters/auth/bcryptHasher';
import { ddbClient, TEST_EVALUATIONS_TABLE, TEST_USERS_TABLE, TEST_COURSES_TABLE } from '../../__tests__/setup-integration';

const doc = DynamoDBDocumentClient.from(ddbClient);
async function clearAll() {
  for (const t of [TEST_EVALUATIONS_TABLE, TEST_USERS_TABLE, TEST_COURSES_TABLE]) {
    const s = await doc.send(new ScanCommand({ TableName: t }));
    for (const i of s.Items ?? []) {
      let key: Record<string, unknown>;
      if (t === TEST_USERS_TABLE) key = { email: i.email };
      else if (t === TEST_COURSES_TABLE) key = { courseId: i.courseId };
      else key = { evaluationId: i.evaluationId };
      await doc.send(new DeleteCommand({ TableName: t, Key: key }));
    }
  }
}

function buildTestApp() {
  const evaluationRepo = new DynamoEvaluationRepository(TEST_EVALUATIONS_TABLE, doc);
  const userRepo = new DynamoUserRepository(TEST_USERS_TABLE, doc);
  const courseRepo = new DynamoCourseRepository(TEST_COURSES_TABLE, doc);
  const tokens = new JwtTokenService('test-secret-must-be-at-least-32-chars+', { accessTtl: '15m', refreshTtl: '7d' });
  const hasher = new BcryptHasher();
  return buildApp({ evaluationRepo, userRepo, courseRepo, tokens, hasher, verifier: hasher });
}

function cookieHeader(setCookies: string[]): string {
  return setCookies.map(c => c.split(';')[0]).join('; ');
}

describe('app (integration)', () => {
  beforeEach(clearAll);

  it('end-to-end: signup → create → list → get → update → delete → list (empty)', async () => {
    const app = buildTestApp();

    // 1. Signup
    const signup = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'me@avacom.com', password: 'password123', name: 'Me' }),
    });
    expect(signup.status).toBe(201);
    const cookies = signup.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    const Cookie = cookieHeader(cookies);

    // 2. Create evaluation
    const create = await app.request('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie },
      body: JSON.stringify({
        courseId: 'CS101', title: 'Midterm', description: 'd',
        dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
      }),
    });
    expect(create.status).toBe(201);
    const { evaluation } = await create.json() as any;
    expect(evaluation.userId).toBeTruthy();
    const evalId = evaluation.evaluationId;

    // 3. List
    const list = await app.request('/api/evaluations', { headers: { Cookie } });
    expect(list.status).toBe(200);
    const listBody = await list.json() as any;
    expect(listBody.items).toHaveLength(1);

    // 4. Get
    const get = await app.request(`/api/evaluations/${evalId}`, { headers: { Cookie } });
    expect(get.status).toBe(200);

    // 5. Update
    const upd = await app.request(`/api/evaluations/${evalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie },
      body: JSON.stringify({ title: 'New title' }),
    });
    expect(upd.status).toBe(200);
    expect((await upd.json() as any).evaluation.title).toBe('New title');

    // 6. Delete (soft)
    const del = await app.request(`/api/evaluations/${evalId}`, {
      method: 'DELETE', headers: { Cookie },
    });
    expect(del.status).toBe(204);

    // 7. List empty
    const list2 = await app.request('/api/evaluations', { headers: { Cookie } });
    expect((await list2.json() as any).items).toHaveLength(0);
  });

  it('rejects request without auth cookie', async () => {
    const r = await buildTestApp().request('/api/evaluations');
    expect(r.status).toBe(401);
  });

  it('isolates evaluations per user', async () => {
    const app = buildTestApp();
    // User A creates an evaluation
    const sA = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'password123', name: 'A' }),
    });
    const cA = cookieHeader(sA.headers.getSetCookie());
    await app.request('/api/evaluations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cA },
      body: JSON.stringify({ courseId: 'c', title: 'a-eval', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active' }),
    });

    // User B signs up and lists
    const sB = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'b@x.com', password: 'password123', name: 'B' }),
    });
    const cB = cookieHeader(sB.headers.getSetCookie());
    const list = await app.request('/api/evaluations', { headers: { Cookie: cB } });
    expect((await list.json() as any).items).toHaveLength(0);
  });

  it('signup with duplicate email returns 409', async () => {
    const app = buildTestApp();
    const body = JSON.stringify({ email: 'dup@x.com', password: 'password123', name: 'A' });
    await app.request('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const second = await app.request('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    expect(second.status).toBe(409);
  });

  it('login with wrong password returns 401', async () => {
    const app = buildTestApp();
    await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'password123', name: 'A' }),
    });
    const r = await app.request('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'wrongggg' }),
    });
    expect(r.status).toBe(401);
  });

  it('GET /api/health responds 200', async () => {
    const r = await buildTestApp().request('/api/health');
    expect(r.status).toBe(200);
    expect((await r.json() as any).status).toBe('ok');
  });

  it('logout clears cookies', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/auth/logout', { method: 'POST' });
    expect(r.status).toBe(204);
    const setCookies = r.headers.getSetCookie();
    expect(setCookies.some(c => c.includes('access_token=;'))).toBe(true);
  });

  it('refresh issues a new access token from refresh cookie', async () => {
    const app = buildTestApp();
    const signup = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'r@x.com', password: 'password123', name: 'R' }),
    });
    const refreshCookie = signup.headers.getSetCookie().find(c => c.startsWith('refresh_token='))!;
    const r = await app.request('/api/auth/refresh', {
      method: 'POST', headers: { Cookie: refreshCookie.split(';')[0] },
    });
    expect(r.status).toBe(204);
    expect(r.headers.getSetCookie().some(c => c.startsWith('access_token='))).toBe(true);
  });

  it('PUT on another user evaluation returns 403', async () => {
    const app = buildTestApp();
    const sA = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'password123', name: 'A' }),
    });
    const cA = cookieHeader(sA.headers.getSetCookie());
    const create = await app.request('/api/evaluations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cA },
      body: JSON.stringify({ courseId: 'c', title: 't', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active' }),
    });
    const evalId = (await create.json() as any).evaluation.evaluationId;

    const sB = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'b@x.com', password: 'password123', name: 'B' }),
    });
    const cB = cookieHeader(sB.headers.getSetCookie());

    const r = await app.request(`/api/evaluations/${evalId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cB },
      body: JSON.stringify({ title: 'hijacked' }),
    });
    expect(r.status).toBe(403);
  });

  it('validation error returns 400 with details', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-email', password: 'short', name: '' }),
    });
    expect(r.status).toBe(400);
    expect((await r.json() as any).error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/courses is public (no auth cookie required)', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/courses');
    expect(r.status).toBe(200);
    const body = await r.json() as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('POST /api/courses still requires auth', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Course' }),
    });
    expect(r.status).toBe(401);
  });
});
