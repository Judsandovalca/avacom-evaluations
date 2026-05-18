// src/components/__tests__/LoadingSpinner.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
  it('renders with custom label', () => {
    render(<LoadingSpinner label="Fetching..." />);
    expect(screen.getByRole('status', { name: 'Fetching...' })).toBeInTheDocument();
  });
});
