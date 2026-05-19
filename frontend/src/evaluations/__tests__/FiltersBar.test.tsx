import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { FiltersBar } from '../FiltersBar';

describe('FiltersBar', () => {
  it('emits status changes', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'active');
    expect(onChange).toHaveBeenCalledWith({ status: 'active', courseId: undefined });
  });

  it('populates the course dropdown from /api/courses', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar onChange={onChange} />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'Data Structures' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All courses' })).toBeInTheDocument();
  });

  it('emits courseId changes when a course is selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar onChange={onChange} />);
    await waitFor(() => screen.getByRole('option', { name: 'Algorithms' }));
    await userEvent.selectOptions(screen.getByLabelText('Course'), 'c-1');
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined, courseId: 'c-1' });
  });

  it('clears status filter to undefined when "All statuses" is selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar status="active" courseId="c-1" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), '');
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined, courseId: 'c-1' });
  });

  it('clears courseId to undefined when "All courses" is selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar status="active" courseId="c-1" onChange={onChange} />);
    await waitFor(() => screen.getByRole('option', { name: 'Algorithms' }));
    await userEvent.selectOptions(screen.getByLabelText('Course'), '');
    expect(onChange).toHaveBeenLastCalledWith({ status: 'active', courseId: undefined });
  });
});
