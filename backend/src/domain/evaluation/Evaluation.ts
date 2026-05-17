import { randomUUID } from 'node:crypto';

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

export interface CreateEvaluationProps {
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
}

export type EvaluationPatch = Partial<Pick<
  Evaluation,
  'courseId' | 'title' | 'description' | 'dueDate' | 'status'
>>;

export const Evaluation = {
  create(props: CreateEvaluationProps): Evaluation {
    const now = new Date().toISOString();
    return {
      evaluationId: randomUUID(),
      userId: props.userId,
      courseId: props.courseId,
      title: props.title,
      description: props.description,
      dueDate: props.dueDate,
      status: props.status,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  },

  applyPatch(e: Evaluation, patch: EvaluationPatch): Evaluation {
    return { ...e, ...patch, updatedAt: new Date().toISOString() };
  },

  softDelete(e: Evaluation): Evaluation {
    const now = new Date().toISOString();
    return { ...e, deletedAt: now, updatedAt: now };
  },

  isDeleted(e: Evaluation): boolean {
    return e.deletedAt !== null;
  },
};
