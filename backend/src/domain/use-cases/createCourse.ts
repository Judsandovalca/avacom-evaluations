import type { CourseRepository } from '../course/CourseRepository';
import { Course } from '../course/Course';
import { ConflictError, ValidationError } from '../errors';

export interface CreateCourseDeps { repo: CourseRepository; }
export interface CreateCourseInput { name: string; }

export function createCourse(deps: CreateCourseDeps) {
  return async (input: CreateCourseInput): Promise<Course> => {
    const name = input.name.trim();
    if (name.length === 0) throw new ValidationError('Course name is required');

    const existing = await deps.repo.list();
    if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      throw new ConflictError('A course with this name already exists');
    }

    const course = Course.create({ name });
    await deps.repo.save(course);
    return course;
  };
}
