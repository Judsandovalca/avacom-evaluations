import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../AuthProvider';
import { LoginPage } from '../LoginPage';
import { ToastProvider } from '../../components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/evaluations" element={<div>Evaluations home</div>} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

describe('LoginPage', () => {
  it('renders email and password fields', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('navigates to /evaluations on successful login', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(screen.getByText('Evaluations home')).toBeInTheDocument());
  });

  it('shows error toast on 401', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(screen.getByText(/invalid/i)).toBeInTheDocument());
  });
});
