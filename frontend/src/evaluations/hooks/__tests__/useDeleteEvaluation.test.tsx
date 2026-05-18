// src/evaluations/hooks/__tests__/useDeleteEvaluation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteEvaluation } from '../useDeleteEvaluation';

describe('useDeleteEvaluation', () => {
  it('invalidates evaluations cache on success', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteEvaluation(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    await act(async () => {
      await result.current.mutateAsync('xyz');
    });
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ['evaluations'] }));
  });
});
