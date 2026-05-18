import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Course } from '../types';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await api.get<{ items: Course[] }>('/courses');
      return data.items;
    },
    staleTime: 60_000,
  });
}
