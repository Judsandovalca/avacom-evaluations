import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQueryClient } from '@tanstack/react-query';
import { server } from '../../__tests__/msw/server';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { AuthProvider } from '../AuthProvider';
import { useAuth } from '../useAuth';

function Probe() {
  const { user, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'yes' : 'no'}</span>
      <span data-testid="user">{user ? user.email : 'anon'}</span>
    </div>
  );
}

type CapturedClient = { current: ReturnType<typeof useQueryClient> | null };

function ClientCapture({ captured }: { captured: CapturedClient }) {
  const qc = useQueryClient();
  const { setUser } = useAuth();
  // Test-only capture of the QueryClient so the assertion can read cache state.
  // eslint-disable-next-line react-hooks/immutability
  captured.current = qc;
  return <button type="button" onClick={() => setUser(null)}>do-logout</button>;
}

describe('AuthProvider', () => {
  it('starts in loading, then resolves to user on /me success', async () => {
    renderWithProviders(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('loading')).toHaveTextContent('yes');
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('no'));
    expect(screen.getByTestId('user')).toHaveTextContent('me@x.com');
  });

  it('resolves to anon when /me returns 401', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({}, { status: 401 })));
    renderWithProviders(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('no'));
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/useAuth must be used within AuthProvider/);
    spy.mockRestore();
  });

  it('clears the TanStack Query cache on logout to prevent stale data leaking between users', async () => {
    const captured: CapturedClient = { current: null };
    renderWithProviders(<ClientCapture captured={captured} />);
    // Wait for AuthProvider's /me hydration so currentUserIdRef is set to a user.
    await waitFor(() => expect(screen.getByRole('button', { name: 'do-logout' })).toBeInTheDocument());
    const qc = captured.current!;
    qc.setQueryData(['evaluations', {}], { items: [{ title: 'A-data' }] });
    expect(qc.getQueryData(['evaluations', {}])).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'do-logout' }));
    expect(qc.getQueryData(['evaluations', {}])).toBeUndefined();
  });
});
