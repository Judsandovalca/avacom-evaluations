import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation, type EvaluationStatus } from '../evaluation/Evaluation';

export interface CreateEvaluationDeps { repo: EvaluationRepository; }
export interface CreateEvaluationInput {
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
}

export function createEvaluation(deps: CreateEvaluationDeps) {
  return async (input: CreateEvaluationInput) => {
    const evaluation = Evaluation.create(input);
    await deps.repo.save(evaluation);
    return evaluation;
  };
}
