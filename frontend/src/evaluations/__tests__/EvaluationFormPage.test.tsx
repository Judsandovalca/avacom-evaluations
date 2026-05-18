// src/evaluations/__tests__/EvaluationFormPage.test.tsx
import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
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
    await userEvent.type(screen.getByLabelText(/course id/i), 'CS101');
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
});
