import type { CourseRepository } from '../course/CourseRepository';
import type { Course } from '../course/Course';
import { DEFAULT_COURSES, Course as CourseFactory } from '../course/Course';

export interface ListCoursesDeps { repo: CourseRepository; }

export function listCourses(deps: ListCoursesDeps) {
  return async (limit: number, key: string): Promise<Course[]> => {
    const courses = await deps.repo.list(limit, key);
    if (courses.length > 0) {
      return [...courses].sort((a, b) => a.name.localeCompare(b.name));
    }
    // Lazy idempotent seed: if table is empty, insert the 6 default courses on first read.
    const seeded = DEFAULT_COURSES.map((name) => CourseFactory.create({ name }));
    await Promise.all(seeded.map((c) => deps.repo.save(c)));
    return [...seeded].sort((a, b) => a.name.localeCompare(b.name));
  };
}
