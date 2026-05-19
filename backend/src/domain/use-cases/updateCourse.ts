import type { CourseRepository } from '../course/CourseRepository';
import type { Course } from '../course/Course';
import { ConflictError, NotFoundError, ValidationError } from '../errors';

export interface UpdateCourseDeps { repo: CourseRepository; }
export interface UpdateCourseInput { courseId: string; name: string; }

export function updateCourse(deps: UpdateCourseDeps) {
  return async (input: UpdateCourseInput): Promise<Course> => {
    const name = input.name.trim();
    if (name.length === 0) throw new ValidationError('Course name is required');

    const existing = await deps.repo.findById(input.courseId);
    if (!existing || existing.deletedAt) throw new NotFoundError('Course not found');

    const others = await deps.repo.list();
    const clash = others.find(
      (c) => c.courseId !== input.courseId && c.name.toLowerCase() === name.toLowerCase(),
    );
    if (clash) throw new ConflictError('A course with this name already exists');

    const updated: Course = { ...existing, name };
    await deps.repo.update(updated);
    return updated;
  };
}
