import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateEvaluation } from '../updateEvaluation';
import { ForbiddenError, NotFoundError } from '../../errors';
import { makeEvaluationRepo, fixture } from './helpers';

describe('updateEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T11:00:00.000Z'));
  });

  it('updates fields and persists', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', title: 'Old' });
    const repo = makeEvaluationRepo([e]);
    const result = await updateEvaluation({ repo })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'New', status: 'completed' },
    });
    expect(result.title).toBe('New');
    expect(result.status).toBe('completed');
    expect(result.updatedAt).toBe('2026-05-17T11:00:00.000Z');
    expect(repo.update).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when not found', async () => {
    await expect(updateEvaluation({ repo: makeEvaluationRepo() })({
      evaluationId: 'x', userId: 'u-1', patch: { title: 'N' },
    })).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when not the owner', async () => {
    const e = fixture({ evaluationId: '1', userId: 'other' });
    await expect(updateEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'N' },
    })).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when soft-deleted', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', deletedAt: '2026' });
    await expect(updateEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'N' },
    })).rejects.toThrow(NotFoundError);
  });

  it('preserves unchanged fields', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', description: 'keep me' });
    const result = await updateEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'New' },
    });
    expect(result.description).toBe('keep me');
  });
});
