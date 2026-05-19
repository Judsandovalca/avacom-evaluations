// src/evaluations/hooks/useEvaluations.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ListFilters, PaginatedEvaluations } from '../types';

export function useEvaluations(filters: ListFilters) {
  // Fetch up to 100 rows in one shot; client-side pagination handles the rest.
  // If users grow past 100 evaluations, switch to useInfiniteQuery + nextCursor.
  const params = { limit: 100, ...filters };
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedEvaluations>('/evaluations', { params });
      return data;
    },
    staleTime: 30_000,
  });
}
