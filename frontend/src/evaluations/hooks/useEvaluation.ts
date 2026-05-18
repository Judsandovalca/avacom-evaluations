// src/evaluations/hooks/useEvaluation.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Evaluation } from '../types';

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ['evaluations', id],
    queryFn: async () => {
      const { data } = await api.get<{ evaluation: Evaluation }>(`/evaluations/${id}`);
      return data.evaluation;
    },
    enabled: id !== '',
  });
}
