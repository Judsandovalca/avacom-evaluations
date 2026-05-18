import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation } from '../evaluation/Evaluation';
import { ForbiddenError, NotFoundError } from '../errors';

export interface GetEvaluationDeps { repo: EvaluationRepository; }
export interface GetEvaluationInput { evaluationId: string; userId: string; }

export function getEvaluation(deps: GetEvaluationDeps) {
  return async (input: GetEvaluationInput) => {
    const e = await deps.repo.findById(input.evaluationId);
    if (!e || Evaluation.isDeleted(e)) throw new NotFoundError('Evaluation not found');
    if (e.userId !== input.userId) throw new ForbiddenError('Access denied');
    return e;
  };
}
