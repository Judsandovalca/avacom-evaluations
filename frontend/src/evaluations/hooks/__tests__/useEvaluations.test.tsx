// src/evaluations/hooks/__tests__/useEvaluations.test.tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../../__tests__/msw/server';
import { useEvaluations } from '../useEvaluations';

function wrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useEvaluations', () => {
  it('returns items from the API', async () => {
    const { result } = renderHook(() => useEvaluations({}), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });

  it('passes filters as query params', async () => {
    let queriedStatus: string | null = null;
    server.use(http.get('/api/evaluations', ({ request }) => {
      queriedStatus = new URL(request.url).searchParams.get('status');
      return HttpResponse.json({ items: [], nextCursor: null });
    }));
    const { result } = renderHook(() => useEvaluations({ status: 'active' }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queriedStatus).toBe('active');
  });
});
