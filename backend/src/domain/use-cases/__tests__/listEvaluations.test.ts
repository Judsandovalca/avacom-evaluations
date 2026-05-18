import { describe, it, expect } from 'vitest';
import { listEvaluations } from '../listEvaluations';
import { makeEvaluationRepo, fixture } from './helpers';

describe('listEvaluations', () => {
  it('returns only the caller user evaluations', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1' }),
      fixture({ evaluationId: '2', userId: 'other' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1' });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].evaluationId).toBe('1');
  });

  it('filters by status', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1', status: 'active' }),
      fixture({ evaluationId: '2', userId: 'u-1', status: 'completed' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1', status: 'completed' });
    expect(r.items.map(i => i.evaluationId)).toEqual(['2']);
  });

  it('filters by courseId', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1', courseId: 'A' }),
      fixture({ evaluationId: '2', userId: 'u-1', courseId: 'B' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1', courseId: 'B' });
    expect(r.items.map(i => i.evaluationId)).toEqual(['2']);
  });

  it('excludes soft-deleted', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1' }),
      fixture({ evaluationId: '2', userId: 'u-1', deletedAt: '2026' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1' });
    expect(r.items.map(i => i.evaluationId)).toEqual(['1']);
  });

  it('paginates with cursor and respects limit', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1', createdAt: '2026-05-17T10:00:00.001Z' }),
      fixture({ evaluationId: '2', userId: 'u-1', createdAt: '2026-05-17T10:00:00.002Z' }),
      fixture({ evaluationId: '3', userId: 'u-1', createdAt: '2026-05-17T10:00:00.003Z' }),
    ]);
    const first = await listEvaluations({ repo })({ userId: 'u-1', limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();

    const next = await listEvaluations({ repo })({ userId: 'u-1', limit: 2, cursor: first.nextCursor! });
    expect(next.items).toHaveLength(1);
    expect(next.nextCursor).toBeNull();
  });

  it('returns empty array when user has no evaluations', async () => {
    const r = await listEvaluations({ repo: makeEvaluationRepo() })({ userId: 'u-1' });
    expect(r.items).toEqual([]);
    expect(r.nextCursor).toBeNull();
  });
});
