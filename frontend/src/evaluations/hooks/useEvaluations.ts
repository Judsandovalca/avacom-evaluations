// src/evaluations/hooks/useEvaluations.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ListFilters, PaginatedEvaluations } from '../types';

export function useEvaluations(filters: ListFilters) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedEvaluations>('/evaluations', { params: filters });
      return data;
    },
    staleTime: 30_000,
  });
}
