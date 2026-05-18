import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/test-utils';
import { EvaluationForm } from '../EvaluationForm';
import type { EvaluationFormInput } from '../../lib/schemas';

function renderForm(props: { initialValues?: EvaluationFormInput; submitting?: boolean; onSubmit?: any } = {}) {
  return renderWithProviders(
    <EvaluationForm
      onSubmit={props.onSubmit ?? vi.fn()}
      submitting={props.submitting ?? false}
      initialValues={props.initialValues}
    />,
  );
}

describe('EvaluationForm', () => {
  it('renders all fields including Course select', async () => {
    renderForm();
    expect(await screen.findByLabelText(/course/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    // Course options from MSW (Algorithms, Data Structures)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
  });

  it('pre-fills initialValues in edit mode', async () => {
    renderForm({ initialValues: {
      courseId: 'c-1', title: 'Pre', description: 'd', dueDate: '2026-06-01T12:00', status: 'completed',
    } });
    // Wait for courses to load so the <option value="c-1"> exists
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
    expect(screen.getByLabelText(/course/i)).toHaveValue('c-1');
    expect(screen.getByLabelText(/title/i)).toHaveValue('Pre');
  });

  it('shows validation error on empty title', async () => {
    renderForm();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/course/i), 'c-1');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/title required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/course/i), 'c-1');
    await userEvent.type(screen.getByLabelText(/title/i), 'Title');
    await userEvent.type(screen.getByLabelText(/description/i), 'Desc');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      courseId: 'c-1', title: 'Title', description: 'Desc', status: 'active',
    });
  });

  it('disables submit while submitting', () => {
    renderForm({
      submitting: true,
      initialValues: { courseId: 'c-1', title: 'T', description: '', dueDate: '2026-06-01T12:00', status: 'active' },
    });
    expect(screen.getByRole('button', { name: /save|loading/i })).toBeDisabled();
  });

  it('shows description error when value exceeds max length', async () => {
    const onSubmit = vi.fn();
    const longDesc = 'x'.repeat(2001);
    renderForm({
      onSubmit,
      initialValues: { courseId: 'c-1', title: 'T', description: longDesc, dueDate: '2026-06-01T12:00', status: 'active' },
    });
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });
});
