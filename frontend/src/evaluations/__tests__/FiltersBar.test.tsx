import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltersBar } from '../FiltersBar';

describe('FiltersBar', () => {
  it('emits status changes', async () => {
    const onChange = vi.fn();
    render(<FiltersBar onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'active');
    expect(onChange).toHaveBeenCalledWith({ status: 'active', courseId: undefined });
  });

  it('emits courseId changes', async () => {
    const onChange = vi.fn();
    render(<FiltersBar onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Course ID'), 'C');
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined, courseId: 'C' });
  });
});
