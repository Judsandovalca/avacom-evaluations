import type { Course } from './Course';

export interface ListCoursesOptions {
  limit?: number;
  key?: string;
}

export interface PaginatedCourses {
  items: Course[];
  nextKey: string | null;
}

export interface CourseRepository {
  save(c: Course): Promise<void>;
  findById(id: string): Promise<Course | null>;
  findByName(name: string): Promise<Course | null>;
  list(opts?: ListCoursesOptions): Promise<PaginatedCourses>;
  update(c: Course): Promise<void>;
}
