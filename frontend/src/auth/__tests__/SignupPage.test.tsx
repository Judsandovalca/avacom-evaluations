import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../AuthProvider';
import { SignupPage } from '../SignupPage';
import { ToastProvider } from '../../components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/evaluations" element={<div>Evaluations home</div>} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

describe('SignupPage', () => {
  it('renders email, password, and name fields', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('shows 8-char minimum error', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.type(screen.getByLabelText(/name/i), 'A');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/at least 8/i)).toBeInTheDocument();
  });

  it('shows duplicate email toast on 409', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'dup@x.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/name/i), 'Dup');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
  });

  it('navigates to /evaluations on success', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'new@x.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/name/i), 'New');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(screen.getByText('Evaluations home')).toBeInTheDocument());
  });
});
