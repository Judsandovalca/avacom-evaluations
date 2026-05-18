// src/evaluations/__tests__/EvaluationsListPage.test.tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '../../__tests__/msw/server';
import { ToastProvider } from '../../components/ToastProvider';
import { EvaluationsListPage } from '../EvaluationsListPage';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/evaluations" element={<EvaluationsListPage />} />
      </Routes>
    </ToastProvider>
  );
}

describe('EvaluationsListPage', () => {
  it('shows loading then table', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => expect(screen.getByText('Eval 1')).toBeInTheDocument());
  });

  it('shows empty state when API returns no items', async () => {
    server.use(http.get('/api/evaluations', () => HttpResponse.json({ items: [], nextCursor: null })));
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => expect(screen.getByText(/no evaluations/i)).toBeInTheDocument());
  });

  it('shows error state and recovers on retry', async () => {
    let attempts = 0;
    server.use(http.get('/api/evaluations', () => {
      attempts += 1;
      return attempts === 1
        ? HttpResponse.json({}, { status: 500 })
        : HttpResponse.json({ items: [], nextCursor: null });
    }));
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(screen.getByText(/no evaluations/i)).toBeInTheDocument());
  });

  it('opens delete dialog and confirms delete', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => screen.getByText('Eval 1'));
    await userEvent.click(screen.getByText('Delete'));
    expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument());
  });
});
