import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationForm } from '../EvaluationForm';

describe('EvaluationForm', () => {
  it('renders all fields', () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting={false} />);
    expect(screen.getByLabelText(/course id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('pre-fills initialValues in edit mode', () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting={false} initialValues={{
      courseId: 'CS101', title: 'Pre', description: 'd', dueDate: '2026-06-01T12:00', status: 'completed',
    }} />);
    expect(screen.getByLabelText(/course id/i)).toHaveValue('CS101');
    expect(screen.getByLabelText(/title/i)).toHaveValue('Pre');
  });

  it('shows validation error on empty title', async () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting={false} />);
    await userEvent.type(screen.getByLabelText(/course id/i), 'CS101');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/title required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn();
    render(<EvaluationForm onSubmit={onSubmit} submitting={false} />);
    await userEvent.type(screen.getByLabelText(/course id/i), 'CS101');
    await userEvent.type(screen.getByLabelText(/title/i), 'Title');
    await userEvent.type(screen.getByLabelText(/description/i), 'Desc');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      courseId: 'CS101', title: 'Title', description: 'Desc', status: 'active',
    });
  });

  it('disables submit while submitting', () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting initialValues={{
      courseId: 'C', title: 'T', description: '', dueDate: '2026-06-01T12:00', status: 'active',
    }} />);
    expect(screen.getByRole('button', { name: /save|loading/i })).toBeDisabled();
  });
});
