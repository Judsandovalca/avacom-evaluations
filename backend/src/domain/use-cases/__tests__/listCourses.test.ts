import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCourses } from '../listCourses';
import { DEFAULT_COURSES } from '../../course/Course';
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

describe('listCourses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns existing courses sorted by name', async () => {
    const repo = makeRepo([
      { courseId: '1', name: 'Z course', createdAt: '2026', deletedAt: null },
      { courseId: '2', name: 'A course', createdAt: '2026', deletedAt: null },
    ]);
    const result = await listCourses({ repo })();
    expect(result.map((c) => c.name)).toEqual(['A course', 'Z course']);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('seeds 6 default courses when the table is empty', async () => {
    const repo = makeRepo([]);
    const result = await listCourses({ repo })();
    expect(result).toHaveLength(DEFAULT_COURSES.length);
    expect(repo.save).toHaveBeenCalledTimes(DEFAULT_COURSES.length);
    const names = result.map((c) => c.name);
    for (const def of DEFAULT_COURSES) expect(names).toContain(def);
  });

  it('does NOT seed if at least one course already exists', async () => {
    const repo = makeRepo([{ courseId: '1', name: 'Only one', createdAt: '2026', deletedAt: null }]);
    const result = await listCourses({ repo })();
    expect(result).toHaveLength(1);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
