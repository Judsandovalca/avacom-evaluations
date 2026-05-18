import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/msw/server';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { AuthProvider } from '../AuthProvider';
import { ProtectedRoute } from '../ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>Secret content</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', async () => {
    renderWithProviders(<App />, { initialEntries: ['/secret'] });
    await waitFor(() => expect(screen.getByText('Secret content')).toBeInTheDocument());
  });

  it('redirects to /login when user is null', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({}, { status: 401 })));
    renderWithProviders(<App />, { initialEntries: ['/secret'] });
    await waitFor(() => expect(screen.getByText('Login screen')).toBeInTheDocument());
  });
});
