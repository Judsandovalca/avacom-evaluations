import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorAlert } from '../ErrorAlert';

describe('ErrorAlert', () => {
  it('renders the message as an alert', () => {
    render(<ErrorAlert message="Could not load courses." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load courses.');
  });

  it('does not render Retry when onRetry is omitted', () => {
    render(<ErrorAlert message="Boom." />);
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull();
  });

  it('calls onRetry when Retry is clicked', async () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Boom." onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
