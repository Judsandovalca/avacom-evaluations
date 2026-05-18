import { randomUUID } from 'node:crypto';

export interface Course {
  courseId: string;
  name: string;
  createdAt: string;
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
