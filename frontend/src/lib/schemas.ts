import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email').trim().toLowerCase(),
  password: z.string().min(1, 'Password required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email('Invalid email').trim().toLowerCase(),
  password: z.string().min(8, 'At least 8 characters').max(100),
  name: z.string().min(1, 'Name required').max(100).trim(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const evaluationStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const evaluationFormSchema = z.object({
  courseId: z.string().min(1, 'Course ID required').max(50),
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().max(2000),
  dueDate: z.string().min(1, 'Due date required'),
  status: evaluationStatusSchema,
});
export type EvaluationFormInput = z.infer<typeof evaluationFormSchema>;
