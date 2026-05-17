import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Evaluation } from '../Evaluation';

describe('Evaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T10:00:00.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('create() generates a UUID, sets timestamps, and defaults deletedAt to null', () => {
    const e = Evaluation.create({
      userId: 'u-1',
      courseId: 'CS101',
      title: 'Midterm',
      description: 'Chapter 1-5',
      dueDate: '2026-06-01T12:00:00.000Z',
      status: 'active',
    });

    expect(e.evaluationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(e.userId).toBe('u-1');
    expect(e.title).toBe('Midterm');
    expect(e.createdAt).toBe('2026-05-17T10:00:00.000Z');
    expect(e.updatedAt).toBe('2026-05-17T10:00:00.000Z');
    expect(e.deletedAt).toBeNull();
  });

  it('applyPatch() updates only provided fields and bumps updatedAt', () => {
    const original = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 'Old', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });

    vi.setSystemTime(new Date('2026-05-17T11:00:00.000Z'));
    const updated = Evaluation.applyPatch(original, { title: 'New', status: 'completed' });

    expect(updated.title).toBe('New');
    expect(updated.status).toBe('completed');
    expect(updated.description).toBe('d');
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.updatedAt).toBe('2026-05-17T11:00:00.000Z');
    expect(updated.evaluationId).toBe(original.evaluationId);
  });

  it('softDelete() sets deletedAt and bumps updatedAt', () => {
    const e = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });

    vi.setSystemTime(new Date('2026-05-17T12:00:00.000Z'));
    const deleted = Evaluation.softDelete(e);

    expect(deleted.deletedAt).toBe('2026-05-17T12:00:00.000Z');
    expect(deleted.updatedAt).toBe('2026-05-17T12:00:00.000Z');
  });

  it('isDeleted() returns true if deletedAt is set', () => {
    const e = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    expect(Evaluation.isDeleted(e)).toBe(false);
    expect(Evaluation.isDeleted({ ...e, deletedAt: '2026-05-17T12:00:00.000Z' })).toBe(true);
  });
});
