// src/evaluations/__tests__/EvaluationFormPage.test.tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '../../__tests__/msw/server';
import { ToastProvider } from '../../components/ToastProvider';
import { EvaluationFormPage } from '../EvaluationFormPage';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/evaluations" element={<div>list</div>} />
        <Route path="/evaluations/new" element={<EvaluationFormPage mode="create" />} />
        <Route path="/evaluations/:id/edit" element={<EvaluationFormPage mode="edit" />} />
      </Routes>
    </ToastProvider>
  );
}

describe('EvaluationFormPage', () => {
  it('create mode renders empty form and submits', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations/new'] });
    expect(await screen.findByText('New evaluation')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/course/i), 'c-1');
    await userEvent.type(screen.getByLabelText(/title/i), 'T');
    await userEvent.type(screen.getByLabelText(/description/i), 'D');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText('list')).toBeInTheDocument());
  });

  it('edit mode prefills and submits update', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations/abc/edit'] });
    expect(await screen.findByText('Edit evaluation')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toHaveValue('Eval'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText('list')).toBeInTheDocument());
  });

  it('shows error toast when create save fails', async () => {
    server.use(
      http.post('/api/evaluations', () => HttpResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })),
    );
    renderWithProviders(<App />, { initialEntries: ['/evaluations/new'] });
    expect(await screen.findByText('New evaluation')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/course/i), 'c-1');
    await userEvent.type(screen.getByLabelText(/title/i), 'T');
    await userEvent.type(screen.getByLabelText(/description/i), 'D');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/save failed/i)).toBeInTheDocument();
  });

  it('edit mode shows error when initial load fails', async () => {
    server.use(
      http.get('/api/evaluations/:id', () => HttpResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })),
    );
    renderWithProviders(<App />, { initialEntries: ['/evaluations/zzz/edit'] });
    expect(await screen.findByText(/could not load evaluation/i)).toBeInTheDocument();
  });
});
