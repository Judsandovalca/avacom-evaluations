import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationsTable } from '../EvaluationsTable';

const items = [
  { evaluationId: '1', userId: 'u', courseId: 'CS101', title: 'A', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active', createdAt: '', updatedAt: '', deletedAt: null },
] as any;

describe('EvaluationsTable', () => {
  it('shows empty state', () => {
    render(<MemoryRouter><EvaluationsTable items={[]} onDelete={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(/no evaluations/i)).toBeInTheDocument();
  });
  it('renders rows', () => {
    render(<MemoryRouter><EvaluationsTable items={items} onDelete={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('CS101')).toBeInTheDocument();
  });
  it('calls onDelete', async () => {
    const onDelete = vi.fn();
    render(<MemoryRouter><EvaluationsTable items={items} onDelete={onDelete} /></MemoryRouter>);
    await userEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
