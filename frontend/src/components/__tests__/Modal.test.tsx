// src/components/__tests__/Modal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(<Modal open={false} onClose={() => {}} title="t"><p>body</p></Modal>);
    expect(screen.queryByText('body')).not.toBeInTheDocument();
  });

  it('renders title and body when open', () => {
    render(<Modal open onClose={() => {}} title="My title"><p>body</p></Modal>);
    expect(screen.getByText('My title')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="t"><p>x</p></Modal>);
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="t"><p>x</p></Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
