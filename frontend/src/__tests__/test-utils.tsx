import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function AllProviders({ children, initialEntries = ['/'], queryClient }: AllProvidersProps) {
  const qc = queryClient ?? makeQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[]; queryClient?: QueryClient },
) {
  const { initialEntries, queryClient, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries} queryClient={queryClient}>{children}</AllProviders>
    ),
    ...rest,
  });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
