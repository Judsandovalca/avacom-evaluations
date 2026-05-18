// src/evaluations/hooks/useUpdateEvaluation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Evaluation, UpdateEvaluationInput } from '../types';

interface Args {
  id: string;
  patch: UpdateEvaluationInput;
}

export function useUpdateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: Args) => {
      const { data } = await api.put<{ evaluation: Evaluation }>(`/evaluations/${id}`, patch);
      return data.evaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}
