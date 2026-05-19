import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/test-utils';
import { EvaluationsTable } from '../EvaluationsTable';

const items = [
  { evaluationId: '1', userId: 'u', courseId: 'c-1', title: 'A', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active', createdAt: '', updatedAt: '', deletedAt: null },
] as any;

describe('EvaluationsTable', () => {
  it('shows empty state', () => {
    renderWithProviders(<EvaluationsTable items={[]} onDelete={vi.fn()} />);
    expect(screen.getByText(/no evaluations/i)).toBeInTheDocument();
  });

  it('renders rows resolving courseId to course name', async () => {
    renderWithProviders(<EvaluationsTable items={items} onDelete={vi.fn()} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    // useCourses returns Algorithms / Data Structures via MSW; c-1 is Algorithms
    await waitFor(() => expect(screen.getByText('Algorithms')).toBeInTheDocument());
  });

  it('calls onDelete', async () => {
    const onDelete = vi.fn();
    renderWithProviders(<EvaluationsTable items={items} onDelete={onDelete} />);
    await waitFor(() => expect(screen.getByText('Algorithms')).toBeInTheDocument());
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
