import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '../../__tests__/msw/server';
import { ToastProvider } from '../ToastProvider';
import { AppNav } from '../AppNav';

function Wrapped() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<><AppNav /><div>PUBLIC_LANDING</div></>} />
        <Route path="/evaluations" element={<><AppNav /><div>EVALS</div></>} />
      </Routes>
    </ToastProvider>
  );
}

describe('AppNav', () => {
  it('renders Evaluations and Courses links', async () => {
    renderWithProviders(<Wrapped />);
    await waitFor(() => expect(screen.getByText('me@x.com')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Evaluations' })).toHaveAttribute('href', '/evaluations');
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/courses');
  });

  it('shows the signed-in user email', async () => {
    renderWithProviders(<Wrapped />);
    await waitFor(() => expect(screen.getByText('me@x.com')).toBeInTheDocument());
  });

  it('calls logout endpoint when Logout is clicked', async () => {
    let calls = 0;
    server.use(http.post('/api/auth/logout', () => { calls += 1; return new HttpResponse(null, { status: 204 }); }));
    renderWithProviders(<Wrapped />, { initialEntries: ['/evaluations'] });
    await waitFor(() => screen.getByText('me@x.com'));
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    await waitFor(() => expect(calls).toBe(1));
  });

  it('navigates to the public landing after logout', async () => {
    server.use(http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })));
    renderWithProviders(<Wrapped />, { initialEntries: ['/evaluations'] });
    await waitFor(() => screen.getByText('me@x.com'));
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    await waitFor(() => expect(screen.getByText('PUBLIC_LANDING')).toBeInTheDocument());
  });
});
