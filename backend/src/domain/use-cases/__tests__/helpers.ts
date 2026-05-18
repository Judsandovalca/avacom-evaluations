import { vi } from 'vitest';
import type { Evaluation } from '../../evaluation/Evaluation';
import type { EvaluationRepository, ListFilters, PaginatedEvaluations } from '../../evaluation/EvaluationRepository';

export function makeEvaluationRepo(initial: Evaluation[] = []): EvaluationRepository {
  const store = new Map<string, Evaluation>(initial.map(e => [e.evaluationId, e]));
  return {
    save: vi.fn(async (e: Evaluation) => { store.set(e.evaluationId, e); }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    listByUser: vi.fn(async (userId: string, f: ListFilters): Promise<PaginatedEvaluations> => {
      const filtered = [...store.values()]
        .filter(e => e.userId === userId)
        .filter(e => e.deletedAt === null)
        .filter(e => !f.status || e.status === f.status)
        .filter(e => !f.courseId || e.courseId === f.courseId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const limit = f.limit ?? 25;
      const start = f.cursor ? filtered.findIndex(e => e.evaluationId === f.cursor) + 1 : 0;
      const page = filtered.slice(start, start + limit);
      const nextCursor = start + limit < filtered.length ? page.at(-1)!.evaluationId : null;
      return { items: page, nextCursor };
    }),
    update: vi.fn(async (e: Evaluation) => {
      if (!store.has(e.evaluationId)) throw new Error('not in repo');
      store.set(e.evaluationId, e);
    }),
  };
}

export function fixture(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    evaluationId: 'eval-1', userId: 'u-1', courseId: 'CS101',
    title: 't', description: 'd', dueDate: '2026-06-01T12:00:00.000Z',
    status: 'active', createdAt: '2026-05-17T10:00:00.000Z',
    updatedAt: '2026-05-17T10:00:00.000Z', deletedAt: null, ...overrides,
  };
}
