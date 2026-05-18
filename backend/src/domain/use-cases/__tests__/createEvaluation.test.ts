import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEvaluation } from '../createEvaluation';
import { makeEvaluationRepo } from './helpers';

describe('createEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T10:00:00.000Z'));
  });

  it('creates evaluation with userId from input (NOT from body)', async () => {
    const repo = makeEvaluationRepo();
    const result = await createEvaluation({ repo })({
      userId: 'u-from-token',
      courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    expect(result.userId).toBe('u-from-token');
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('sets timestamps and null deletedAt', async () => {
    const repo = makeEvaluationRepo();
    const result = await createEvaluation({ repo })({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    expect(result.createdAt).toBe('2026-05-17T10:00:00.000Z');
    expect(result.updatedAt).toBe('2026-05-17T10:00:00.000Z');
    expect(result.deletedAt).toBeNull();
  });

  it('generates a unique evaluationId', async () => {
    const repo = makeEvaluationRepo();
    const a = await createEvaluation({ repo })({ userId: 'u', courseId: 'c', title: 't', description: 'd', dueDate: '2026', status: 'active' });
    const b = await createEvaluation({ repo })({ userId: 'u', courseId: 'c', title: 't', description: 'd', dueDate: '2026', status: 'active' });
    expect(a.evaluationId).not.toBe(b.evaluationId);
  });
});
