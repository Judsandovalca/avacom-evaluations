// src/evaluations/types.ts
export type EvaluationStatus = 'active' | 'completed' | 'cancelled';

export interface Evaluation {
  evaluationId: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

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

export interface CreateEvaluationInput {
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
}

export type UpdateEvaluationInput = Partial<CreateEvaluationInput>;
