import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Course, CreateCourseInput } from '../types';

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const { data } = await api.post<{ course: Course }>('/courses', input);
      return data.course;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); },
  });
}
