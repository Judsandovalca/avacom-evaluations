import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(<DeleteConfirmDialog open={false} title="X" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText(/delete evaluation/i)).not.toBeInTheDocument();
  });
  it('confirms when Delete clicked', async () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmDialog open title="My Eval" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
  it('cancels when Cancel clicked', async () => {
    const onCancel = vi.fn();
    render(<DeleteConfirmDialog open title="My Eval" onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
