import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const Boom = () => {
  throw new Error('kaboom');
};

describe('ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <span>OK</span>
      </ErrorBoundary>
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
