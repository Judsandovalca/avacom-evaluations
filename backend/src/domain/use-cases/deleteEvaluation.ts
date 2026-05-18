import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation } from '../evaluation/Evaluation';
import { ForbiddenError, NotFoundError } from '../errors';

export interface DeleteEvaluationDeps { repo: EvaluationRepository; }
export interface DeleteEvaluationInput { evaluationId: string; userId: string; }

export function deleteEvaluation(deps: DeleteEvaluationDeps) {
  return async (input: DeleteEvaluationInput): Promise<void> => {
    const existing = await deps.repo.findById(input.evaluationId);
    if (!existing || Evaluation.isDeleted(existing)) {
      throw new NotFoundError('Evaluation not found');
    }
    if (existing.userId !== input.userId) {
      throw new ForbiddenError('Access denied');
    }
    await deps.repo.update(Evaluation.softDelete(existing));
  };
}
