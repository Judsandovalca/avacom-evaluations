import type { Evaluation, EvaluationStatus } from './Evaluation';

export interface ListFilters {
  status?: EvaluationStatus;
  courseId?: string;
  limit?: number;
  cursor?: string;
}

export interface PaginatedEvaluations {
  items: Evaluation[];
  nextCursor: string | null;
}

export interface EvaluationRepository {
  save(e: Evaluation): Promise<void>;
  findById(id: string): Promise<Evaluation | null>;
  listByUser(userId: string, filters: ListFilters): Promise<PaginatedEvaluations>;
  update(e: Evaluation): Promise<void>;
}
