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

describe('listCourses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns existing courses sorted by name', async () => {
    const repo = makeRepo([
      { courseId: '1', name: 'Z course', createdAt: '2026', deletedAt: null },
      { courseId: '2', name: 'A course', createdAt: '2026', deletedAt: null },
    ]);
    const result = await listCourses({ repo })();
    expect(result.items.map((c) => c.name)).toEqual(['A course', 'Z course']);
    expect(result.nextKey).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('seeds default courses when the first page is empty', async () => {
    const repo = makeRepo([]);
    const result = await listCourses({ repo })();
    expect(result.items).toHaveLength(DEFAULT_COURSES.length);
    expect(repo.save).toHaveBeenCalledTimes(DEFAULT_COURSES.length);
    const names = result.items.map((c) => c.name);
    for (const def of DEFAULT_COURSES) expect(names).toContain(def);
  });

  it('does NOT seed when a later page comes back empty', async () => {
    const repo = makeRepo([]);
    const result = await listCourses({ repo })({ key: 'some-cursor' });
    expect(result.items).toEqual([]);
    expect(result.nextKey).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('forwards limit and key to the repo and returns its nextKey', async () => {
    const repo = makeRepo([
      { courseId: '1', name: 'A', createdAt: '2026', deletedAt: null },
    ]);
    vi.mocked(repo.list).mockResolvedValueOnce({
      items: [{ courseId: '1', name: 'A', createdAt: '2026', deletedAt: null }],
      nextKey: 'cursor-2',
    });
    const result = await listCourses({ repo })({ limit: 5, key: 'cursor-1' });
    expect(repo.list).toHaveBeenCalledWith({ limit: 5, key: 'cursor-1' });
    expect(result.nextKey).toBe('cursor-2');
  });
});
