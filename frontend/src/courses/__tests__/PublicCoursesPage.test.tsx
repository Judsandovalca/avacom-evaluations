import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { AuthProvider } from '../../auth/AuthProvider';
import { server } from '../../__tests__/msw/server';
import { PublicCoursesPage } from '../PublicCoursesPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PublicCoursesPage />} />
        <Route path="/evaluations" element={<div>EVAL_PAGE</div>} />
      </Routes>
    </AuthProvider>
  );
}

const loggedOut = () =>
  http.get('/api/auth/me', () =>
    HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }),
  );

describe('PublicCoursesPage', () => {
  it('renders the public list with row numbers when logged out', async () => {
    server.use(loggedOut());
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByText('Algorithms')).toBeInTheDocument());
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    const html = document.body.innerHTML;
    expect(html).not.toContain('c-1');
    expect(html).not.toContain('c-2');
  });

  it('has a Log in link and a New evaluation link', async () => {
    server.use(loggedOut());
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => screen.getByText('Algorithms'));
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /new evaluation/i })).toHaveAttribute('href', '/evaluations/new');
  });

  it('redirects logged-in users to /evaluations', async () => {
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByText('EVAL_PAGE')).toBeInTheDocument());
  });

  it('shows empty state when there are no courses', async () => {
    server.use(
      loggedOut(),
      http.get('/api/courses', () => HttpResponse.json({ items: [] })),
    );
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByText(/no courses yet/i)).toBeInTheDocument());
  });

  it('shows an error alert when the courses fetch fails', async () => {
    server.use(
      loggedOut(),
      http.get('/api/courses', () => HttpResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })),
    );
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
