import type {
  CourseRepository, ListCoursesOptions, PaginatedCourses,
} from '../course/CourseRepository';
import { DEFAULT_COURSES, Course as CourseFactory } from '../course/Course';

export interface ListCoursesDeps { repo: CourseRepository; }

export function listCourses(deps: ListCoursesDeps) {
  return async (opts: ListCoursesOptions = {}): Promise<PaginatedCourses> => {
    const page = await deps.repo.list(opts);
    if (page.items.length > 0) {
      const items = [...page.items].sort((a, b) => a.name.localeCompare(b.name));
      return { items, nextKey: page.nextKey };
    }
    // Lazy idempotent seed: only on the first page. If a later page is empty,
    // it just means we've reached the end — don't re-seed defaults.
    if (opts.key) return page;

    const seeded = DEFAULT_COURSES.map((name) => CourseFactory.create({ name }));
    await Promise.all(seeded.map((c) => deps.repo.save(c)));
    return {
      items: [...seeded].sort((a, b) => a.name.localeCompare(b.name)),
      nextKey: null,
    };
  };
}
