import type { CourseRepository } from '../course/CourseRepository';
import { NotFoundError } from '../errors';

export interface DeleteCourseDeps { repo: CourseRepository; }
export interface DeleteCourseInput { courseId: string; }

export function deleteCourse(deps: DeleteCourseDeps) {
  return async (input: DeleteCourseInput): Promise<void> => {
    const existing = await deps.repo.findById(input.courseId);
    if (!existing || existing.deletedAt) throw new NotFoundError('Course not found');

    await deps.repo.update({ ...existing, deletedAt: new Date().toISOString() });
  };
}
