// src/http/schemas.ts
import { z } from 'zod';

export const evaluationStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const signupSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).trim(),
});
export type SignupBody = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof loginSchema>;

export const createEvaluationSchema = z.object({
  courseId: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  dueDate: z.string().datetime(),
  status: evaluationStatusSchema,
});
export type CreateEvaluationBody = z.infer<typeof createEvaluationSchema>;

export const updateEvaluationSchema = z.object({
  courseId: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  status: evaluationStatusSchema.optional(),
}).refine(o => Object.keys(o).length > 0, { message: 'At least one field is required' });
export type UpdateEvaluationBody = z.infer<typeof updateEvaluationSchema>;

export const listEvaluationsQuerySchema = z.object({
  status: evaluationStatusSchema.optional(),
  courseId: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});
export type ListEvaluationsQuery = z.infer<typeof listEvaluationsQuerySchema>;

export const createCourseSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});
export type CreateCourseBody = z.infer<typeof createCourseSchema>;

export const listCoursesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  key: z.string().min(1).optional(),
});
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;

export const updateCourseSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});
export type UpdateCourseBody = z.infer<typeof updateCourseSchema>;
