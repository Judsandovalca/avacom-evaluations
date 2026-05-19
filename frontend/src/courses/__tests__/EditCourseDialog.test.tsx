import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditCourseDialog } from '../EditCourseDialog';
import type { Course } from '../types';

const course: Course = {
  courseId: 'c-1', name: 'Algorithms', createdAt: '2026', deletedAt: null,
};

describe('EditCourseDialog', () => {
  it('does not render when course is null', () => {
    render(<EditCourseDialog course={null} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('prefills the input with the course name', () => {
    render(<EditCourseDialog course={course} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Course name')).toHaveValue('Algorithms');
  });

  it('disables Save when the name is unchanged', () => {
    render(<EditCourseDialog course={course} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('calls onSave with the trimmed name', async () => {
    const onSave = vi.fn();
    render(<EditCourseDialog course={course} onSave={onSave} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Course name');
    await userEvent.clear(input);
    await userEvent.type(input, '  Advanced Algorithms  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Advanced Algorithms'));
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<EditCourseDialog course={course} onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
