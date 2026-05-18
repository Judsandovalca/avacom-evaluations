import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation, type EvaluationPatch } from '../evaluation/Evaluation';
import { ForbiddenError, NotFoundError } from '../errors';

export interface UpdateEvaluationDeps { repo: EvaluationRepository; }
export interface UpdateEvaluationInput {
  evaluationId: string;
  userId: string;
  patch: EvaluationPatch;
}

export function updateEvaluation(deps: UpdateEvaluationDeps) {
  return async (input: UpdateEvaluationInput) => {
    const existing = await deps.repo.findById(input.evaluationId);
    if (!existing || Evaluation.isDeleted(existing)) {
      throw new NotFoundError('Evaluation not found');
    }
    if (existing.userId !== input.userId) {
      throw new ForbiddenError('Access denied');
    }
    const updated = Evaluation.applyPatch(existing, input.patch);
    await deps.repo.update(updated);
    return updated;
  };
}
