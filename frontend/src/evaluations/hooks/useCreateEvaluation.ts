// src/evaluations/hooks/useCreateEvaluation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CreateEvaluationInput, Evaluation } from '../types';

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEvaluationInput) => {
      const { data } = await api.post<{ evaluation: Evaluation }>('/evaluations', input);
      return data.evaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}
