import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema, evaluationFormSchema } from '../schemas';

describe('schemas', () => {
  it('loginSchema accepts valid', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('loginSchema rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'no-at', password: 'x' }).success).toBe(false);
  });
  it('signupSchema enforces 8-char password', () => {
    expect(signupSchema.safeParse({ email: 'a@b.com', password: 'short', name: 'A' }).success).toBe(false);
  });
  it('evaluationFormSchema requires title', () => {
    expect(evaluationFormSchema.safeParse({
      courseId: 'C', title: '', description: '', dueDate: '2026-06-01', status: 'active',
    }).success).toBe(false);
  });
});
