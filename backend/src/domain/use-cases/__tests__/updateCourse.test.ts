import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCourse } from '../updateCourse';
import { ConflictError, NotFoundError, ValidationError } from '../../errors';
import type { CourseRepository } from '../../course/CourseRepository';
import type { Course } from '../../course/Course';

function makeRepo(initial: Course[] = []): CourseRepository {
  const store = new Map(initial.map((c) => [c.courseId, c]));
  return {
    save: vi.fn(async (c: Course) => { store.set(c.courseId, c); }),
    findById: vi.fn(async (id) => store.get(id) ?? null),
    findByName: vi.fn(async (name: string) => {
      const target = name.toLowerCase();
      return [...store.values()].find(
        (c) => !c.deletedAt && c.name.toLowerCase() === target,
      ) ?? null;
    }),
    list: vi.fn(async () => ({
      items: [...store.values()].filter((c) => !c.deletedAt),
      nextKey: null,
    })),
    update: vi.fn(async (c: Course) => { store.set(c.courseId, c); }),
  };
}

const existing = (over: Partial<Course> = {}): Course => ({
  courseId: '1', name: 'Algorithms', createdAt: '2026-01-01T00:00:00.000Z', deletedAt: null, ...over,
});

describe('updateCourse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renames the course', async () => {
    const repo = makeRepo([existing()]);
    const r = await updateCourse({ repo })({ courseId: '1', name: 'New Algorithms' });
    expect(r.name).toBe('New Algorithms');
    expect(repo.update).toHaveBeenCalledOnce();
  });

  it('trims the new name', async () => {
    const repo = makeRepo([existing()]);
    const r = await updateCourse({ repo })({ courseId: '1', name: '  Trimmed  ' });
    expect(r.name).toBe('Trimmed');
  });

  it('throws ValidationError on empty name', async () => {
    const repo = makeRepo([existing()]);
    await expect(updateCourse({ repo })({ courseId: '1', name: '   ' }))
      .rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError when course does not exist', async () => {
    const repo = makeRepo();
    await expect(updateCourse({ repo })({ courseId: 'missing', name: 'X' }))
      .rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when course was already soft-deleted', async () => {
    const repo = makeRepo([existing({ deletedAt: '2026' })]);
    await expect(updateCourse({ repo })({ courseId: '1', name: 'X' }))
      .rejects.toThrow(NotFoundError);
  });

  it('throws ConflictError when another course has the same name (case-insensitive)', async () => {
    const repo = makeRepo([
      existing({ courseId: '1', name: 'Algorithms' }),
      existing({ courseId: '2', name: 'Data Structures' }),
    ]);
    await expect(updateCourse({ repo })({ courseId: '1', name: 'data structures' }))
      .rejects.toThrow(ConflictError);
  });

  it('allows renaming to the same name (self) without conflict', async () => {
    const repo = makeRepo([existing()]);
    const r = await updateCourse({ repo })({ courseId: '1', name: 'Algorithms' });
    expect(r.name).toBe('Algorithms');
  });
});
