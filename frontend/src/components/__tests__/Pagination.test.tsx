import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders every page when pageCount <= 7', () => {
    render(<Pagination page={3} pageCount={5} onPageChange={vi.fn()} />);
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument();
    }
  });

  it('inserts ellipses when pageCount > 7', () => {
    render(<Pagination page={5} pageCount={12} onPageChange={vi.fn()} />);
    expect(screen.getAllByText('…')).not.toHaveLength(0);
    // first and last always shown
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12' })).toBeInTheDocument();
    // current ± 1 shown
    for (const n of [4, 5, 6]) {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument();
    }
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination page={3} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange on a page click', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables Previous on page 1 and Next on last page', () => {
    const { rerender } = render(<Pagination page={1} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    rerender(<Pagination page={5} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });
});
