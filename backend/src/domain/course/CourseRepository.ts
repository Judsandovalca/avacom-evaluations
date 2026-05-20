import type { Course } from './Course';

export interface CourseRepository {
  save(c: Course): Promise<void>;
  findById(id: string): Promise<Course | null>;
  list(limit:number, key: string): Promise<Course[]>;
  update(c: Course): Promise<void>;
}
