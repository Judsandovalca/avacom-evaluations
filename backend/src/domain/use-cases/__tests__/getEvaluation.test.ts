import { describe, it, expect } from 'vitest';
import { getEvaluation } from '../getEvaluation';
import { ForbiddenError, NotFoundError } from '../../errors';
import { makeEvaluationRepo, fixture } from './helpers';

describe('getEvaluation', () => {
  it('returns the evaluation when owner matches', async () => {
    const e = fixture({ evaluationId: 'eval-1', userId: 'u-1' });
    const result = await getEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: 'eval-1', userId: 'u-1',
    });
    expect(result.evaluationId).toBe('eval-1');
  });

  it('throws NotFoundError when not found', async () => {
    await expect(
      getEvaluation({ repo: makeEvaluationRepo() })({ evaluationId: 'x', userId: 'u-1' })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when caller is not the owner', async () => {
    const e = fixture({ evaluationId: 'eval-1', userId: 'other' });
    await expect(
      getEvaluation({ repo: makeEvaluationRepo([e]) })({ evaluationId: 'eval-1', userId: 'u-1' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('hides soft-deleted evaluations (treated as NotFound)', async () => {
    const e = fixture({ evaluationId: 'eval-1', userId: 'u-1', deletedAt: '2026' });
    await expect(
      getEvaluation({ repo: makeEvaluationRepo([e]) })({ evaluationId: 'eval-1', userId: 'u-1' })
    ).rejects.toThrow(NotFoundError);
  });
});
