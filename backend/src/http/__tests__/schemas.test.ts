// src/http/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  signupSchema, loginSchema, createEvaluationSchema,
  updateEvaluationSchema, listEvaluationsQuerySchema,
} from '../schemas';

describe('schemas', () => {
  describe('signupSchema', () => {
    it('accepts valid input', () => {
      expect(signupSchema.safeParse({ email: 'a@b.com', password: 'password123', name: 'A' }).success).toBe(true);
    });
    it('rejects short password', () => {
      expect(signupSchema.safeParse({ email: 'a@b.com', password: 'short', name: 'A' }).success).toBe(false);
    });
    it('rejects invalid email', () => {
      expect(signupSchema.safeParse({ email: 'not-email', password: 'password123', name: 'A' }).success).toBe(false);
    });
    it('rejects missing name', () => {
      expect(signupSchema.safeParse({ email: 'a@b.com', password: 'password123' }).success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    });
    it('rejects missing password', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
    });
  });

  describe('createEvaluationSchema', () => {
    const ok = { courseId: 'CS101', title: 'Midterm', description: 'desc', dueDate: '2026-06-01T12:00:00.000Z', status: 'active' };
    it('accepts valid', () => { expect(createEvaluationSchema.safeParse(ok).success).toBe(true); });
    it('rejects bad status', () => { expect(createEvaluationSchema.safeParse({ ...ok, status: 'x' }).success).toBe(false); });
    it('rejects bad dueDate', () => { expect(createEvaluationSchema.safeParse({ ...ok, dueDate: 'tomorrow' }).success).toBe(false); });
    it('rejects empty title', () => { expect(createEvaluationSchema.safeParse({ ...ok, title: '' }).success).toBe(false); });
  });

  describe('updateEvaluationSchema', () => {
    it('accepts partial', () => {
      expect(updateEvaluationSchema.safeParse({ title: 'new' }).success).toBe(true);
    });
    it('rejects empty patch', () => {
      expect(updateEvaluationSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('listEvaluationsQuerySchema', () => {
    it('accepts empty', () => {
      expect(listEvaluationsQuerySchema.safeParse({}).success).toBe(true);
    });
    it('coerces limit to number', () => {
      const r = listEvaluationsQuerySchema.safeParse({ limit: '10' });
      expect(r.success && r.data.limit).toBe(10);
    });
    it('rejects bad status', () => {
      expect(listEvaluationsQuerySchema.safeParse({ status: 'wat' }).success).toBe(false);
    });
  });
});
