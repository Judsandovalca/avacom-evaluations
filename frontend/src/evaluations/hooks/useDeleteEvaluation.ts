// src/evaluations/hooks/useDeleteEvaluation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useDeleteEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/evaluations/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}
