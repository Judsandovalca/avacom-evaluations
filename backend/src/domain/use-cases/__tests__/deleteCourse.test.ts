import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCourse } from '../deleteCourse';
import { NotFoundError } from '../../errors';
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

const existing = (over: Partial<Course> = {}): Course => ({
  courseId: '1', name: 'Algorithms', createdAt: '2026-01-01T00:00:00.000Z', deletedAt: null, ...over,
});

describe('deleteCourse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-19T10:00:00.000Z'));
  });

  it('soft-deletes by setting deletedAt to now', async () => {
    const repo = makeRepo([existing()]);
    await deleteCourse({ repo })({ courseId: '1' });
    const persisted = vi.mocked(repo.update).mock.calls[0]?.[0];
    expect(persisted?.deletedAt).toBe('2026-05-19T10:00:00.000Z');
  });

  it('throws NotFoundError when course does not exist', async () => {
    const repo = makeRepo();
    await expect(deleteCourse({ repo })({ courseId: 'missing' }))
      .rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when course was already soft-deleted', async () => {
    const repo = makeRepo([existing({ deletedAt: '2026-05-01T00:00:00.000Z' })]);
    await expect(deleteCourse({ repo })({ courseId: '1' }))
      .rejects.toThrow(NotFoundError);
  });
});
