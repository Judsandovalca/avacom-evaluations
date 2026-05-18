// src/evaluations/hooks/__tests__/useUpdateEvaluation.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateEvaluation } from '../useUpdateEvaluation';

describe('useUpdateEvaluation', () => {
  it('updates and returns the patched evaluation', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUpdateEvaluation(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    let updated;
    await act(async () => {
      updated = await result.current.mutateAsync({ id: 'xyz', patch: { title: 'new' } });
    });
    expect((updated as any).title).toBe('new');
  });
});
