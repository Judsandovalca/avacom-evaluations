// src/components/__tests__/ToastProvider.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../ToastProvider';

function Trigger() {
  const { show } = useToast();
  return (
    <>
      <button onClick={() => show('Hello!')}>OK</button>
      <button onClick={() => show('Boom', 'error')}>Fail</button>
    </>
  );
}

describe('ToastProvider', () => {
  it('shows toast after action', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByText('OK'));
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('shows error toast', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByText('Fail'));
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });
});
