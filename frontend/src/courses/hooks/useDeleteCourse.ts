import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      await api.delete(`/courses/${courseId}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); },
  });
}
