import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteEvaluation } from '../deleteEvaluation';
import { ForbiddenError, NotFoundError } from '../../errors';
import { makeEvaluationRepo, fixture } from './helpers';

describe('deleteEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T11:00:00.000Z'));
  });

  it('soft-deletes by setting deletedAt', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1' });
    const repo = makeEvaluationRepo([e]);
    await deleteEvaluation({ repo })({ evaluationId: '1', userId: 'u-1' });
    const persisted = vi.mocked(repo.update).mock.calls[0]?.[0];
    expect(persisted?.deletedAt).toBe('2026-05-17T11:00:00.000Z');
  });

  it('throws NotFoundError when not found', async () => {
    await expect(deleteEvaluation({ repo: makeEvaluationRepo() })({
      evaluationId: 'x', userId: 'u-1',
    })).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when not the owner', async () => {
    const e = fixture({ evaluationId: '1', userId: 'other' });
    await expect(deleteEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1',
    })).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when already deleted', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', deletedAt: '2026' });
    await expect(deleteEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1',
    })).rejects.toThrow(NotFoundError);
  });
});
