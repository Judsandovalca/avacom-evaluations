import type { EvaluationRepository, PaginatedEvaluations } from '../evaluation/EvaluationRepository';
import type { EvaluationStatus } from '../evaluation/Evaluation';

export interface ListEvaluationsDeps { repo: EvaluationRepository; }
export interface ListEvaluationsInput {
  userId: string;
  status?: EvaluationStatus;
  courseId?: string;
  limit?: number;
  cursor?: string;
}

export function listEvaluations(deps: ListEvaluationsDeps) {
  return async (input: ListEvaluationsInput): Promise<PaginatedEvaluations> => {
    return deps.repo.listByUser(input.userId, {
      status: input.status,
      courseId: input.courseId,
      limit: input.limit,
      cursor: input.cursor,
    });
  };
}
