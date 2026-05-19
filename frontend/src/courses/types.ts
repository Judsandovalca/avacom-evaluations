export interface Course {
  courseId: string;
  name: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateCourseInput {
  name: string;
}

export interface UpdateCourseInput {
  courseId: string;
  name: string;
}
