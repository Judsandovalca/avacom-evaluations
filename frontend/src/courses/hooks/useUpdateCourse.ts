import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Course, UpdateCourseInput } from '../types';

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, name }: UpdateCourseInput) => {
      const { data } = await api.put<{ course: Course }>(`/courses/${courseId}`, { name });
      return data.course;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); },
  });
}
