import { http, HttpResponse } from 'msw';

const API = '/api';

export const handlers = [
  http.post(`${API}/auth/signup`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name: string };
    if (body.email === 'dup@x.com') return HttpResponse.json({ error: { code: 'CONFLICT', message: 'Email exists' } }, { status: 409 });
    return HttpResponse.json(
      { user: { userId: 'u-1', email: body.email, name: body.name } },
      { status: 201, headers: { 'Set-Cookie': 'access_token=AT; HttpOnly' } },
    );
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.password === 'wrongpass') return HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid' } }, { status: 401 });
    return HttpResponse.json(
      { user: { userId: 'u-1', email: body.email, name: 'Logged In' } },
      { status: 200 },
    );
  }),

  http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API}/auth/me`, () => HttpResponse.json({
    user: { userId: 'u-1', email: 'me@x.com', name: 'Me' },
  })),

  http.get(`${API}/evaluations`, () => HttpResponse.json({
    items: [
      { evaluationId: 'e1', userId: 'u-1', courseId: 'CS101', title: 'Eval 1', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active', createdAt: '2026-05-17T10:00:00.000Z', updatedAt: '2026-05-17T10:00:00.000Z', deletedAt: null },
    ],
    nextCursor: null,
  })),

  http.get(`${API}/evaluations/:id`, ({ params }) => HttpResponse.json({
    evaluation: { evaluationId: params.id, userId: 'u-1', courseId: 'CS101', title: 'Eval', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active', createdAt: '2026-05-17T10:00:00.000Z', updatedAt: '2026-05-17T10:00:00.000Z', deletedAt: null },
  })),

  http.post(`${API}/evaluations`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      evaluation: { evaluationId: 'new-id', userId: 'u-1', ...body, createdAt: '2026', updatedAt: '2026', deletedAt: null },
    }, { status: 201 });
  }),

  http.put(`${API}/evaluations/:id`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      evaluation: { evaluationId: params.id, userId: 'u-1', courseId: 'CS101', description: 'd', dueDate: '2026', status: 'active', ...body, createdAt: '2026', updatedAt: '2026', deletedAt: null },
    });
  }),

  http.delete(`${API}/evaluations/:id`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API}/courses`, () => HttpResponse.json({
    items: [
      { courseId: 'c-1', name: 'Algorithms', createdAt: '2026-05-17T10:00:00.000Z' },
      { courseId: 'c-2', name: 'Data Structures', createdAt: '2026-05-17T10:00:00.000Z' },
    ],
  })),

  http.post(`${API}/courses`, async ({ request }) => {
    const body = await request.json() as { name: string };
    if (body.name === 'Algorithms') {
      return HttpResponse.json({ error: { code: 'CONFLICT', message: 'exists' } }, { status: 409 });
    }
    return HttpResponse.json({
      course: { courseId: 'new-course-id', name: body.name, createdAt: '2026-05-17T10:00:00.000Z', deletedAt: null },
    }, { status: 201 });
  }),

  http.put(`${API}/courses/:id`, async ({ request, params }) => {
    const body = await request.json() as { name: string };
    if (body.name === 'Algorithms') {
      return HttpResponse.json({ error: { code: 'CONFLICT', message: 'exists' } }, { status: 409 });
    }
    return HttpResponse.json({
      course: { courseId: params.id, name: body.name, createdAt: '2026-05-17T10:00:00.000Z', deletedAt: null },
    });
  }),

  http.delete(`${API}/courses/:id`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API}/health`, () => HttpResponse.json({ status: 'ok', version: 'test', uptime: 1 })),
];
