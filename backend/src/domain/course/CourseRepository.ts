import type { Course } from './Course';

export interface CourseRepository {
  save(c: Course): Promise<void>;
  findById(id: string): Promise<Course | null>;
  list(): Promise<Course[]>;
}
