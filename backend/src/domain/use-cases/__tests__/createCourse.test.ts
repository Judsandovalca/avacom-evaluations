import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCourse } from '../createCourse';
import { ConflictError, ValidationError } from '../../errors';
import type { CourseRepository } from '../../course/CourseRepository';
import type { Course } from '../../course/Course';

function makeRepo(initial: Course[] = []): CourseRepository {
  const store = new Map(initial.map((c) => [c.courseId, c]));
  return {
    save: vi.fn(async (c: Course) => { store.set(c.courseId, c); }),
    findById: vi.fn(async (id) => store.get(id) ?? null),
    list: vi.fn(async () => [...store.values()].filter((c) => !c.deletedAt)),
    update: vi.fn(async (c: Course) => { store.set(c.courseId, c); }),
  };
}

describe('createCourse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates and persists a course', async () => {
    const repo = makeRepo();
    const c = await createCourse({ repo })({ name: 'Cybersecurity' });
    expect(c.courseId).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.name).toBe('Cybersecurity');
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('trims whitespace from name', async () => {
    const repo = makeRepo();
    const c = await createCourse({ repo })({ name: '  Trimmed  ' });
    expect(c.name).toBe('Trimmed');
  });

  it('throws ValidationError on empty/whitespace-only name', async () => {
    const repo = makeRepo();
    await expect(createCourse({ repo })({ name: '   ' })).rejects.toThrow(ValidationError);
  });

  it('throws ConflictError on case-insensitive duplicate name', async () => {
    const repo = makeRepo([{ courseId: '1', name: 'Algorithms', createdAt: '2026', deletedAt: null }]);
    await expect(createCourse({ repo })({ name: 'ALGORITHMS' })).rejects.toThrow(ConflictError);
  });
});
