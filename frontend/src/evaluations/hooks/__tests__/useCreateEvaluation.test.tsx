// src/evaluations/hooks/__tests__/useCreateEvaluation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateEvaluation } from '../useCreateEvaluation';

describe('useCreateEvaluation', () => {
  it('invalidates ["evaluations"] on success', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateEvaluation(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    await act(async () => {
      await result.current.mutateAsync({
        courseId: 'c',
        title: 't',
        description: 'd',
        dueDate: '2026-06-01T12:00:00.000Z',
        status: 'active',
      });
    });
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ['evaluations'] }));
  });
});
