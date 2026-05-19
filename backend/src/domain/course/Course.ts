import { randomUUID } from 'node:crypto';

export interface Course {
  courseId: string;
  name: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateCourseProps {
  name: string;
}

export const Course = {
  create(props: CreateCourseProps): Course {
    return {
      courseId: randomUUID(),
      name: props.name.trim(),
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
  },
};

export const DEFAULT_COURSES: string[] = [
  'Computer Science 101',
  'Data Structures',
  'Algorithms',
  'Web Development',
  'Database Systems',
  'Software Engineering',
];
