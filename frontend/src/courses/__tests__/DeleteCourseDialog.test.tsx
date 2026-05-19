import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteCourseDialog } from '../DeleteCourseDialog';
import type { Course } from '../types';

const course: Course = {
  courseId: 'c-1', name: 'Algorithms', createdAt: '2026', deletedAt: null,
};

describe('DeleteCourseDialog', () => {
  it('does not render when course is null', () => {
    render(<DeleteCourseDialog course={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the course name in the confirmation copy', () => {
    render(<DeleteCourseDialog course={course} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
  });

  it('calls onConfirm when Delete is clicked', async () => {
    const onConfirm = vi.fn();
    render(<DeleteCourseDialog course={course} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<DeleteCourseDialog course={course} onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
