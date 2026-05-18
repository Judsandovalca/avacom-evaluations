// src/evaluations/hooks/__tests__/useEvaluation.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvaluation } from '../useEvaluation';

function wrapper() {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={c}>{children}</QueryClientProvider>
  );
}

describe('useEvaluation', () => {
  it('fetches by id', async () => {
    const { result } = renderHook(() => useEvaluation('xyz'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.evaluationId).toBe('xyz');
  });

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useEvaluation(''), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
