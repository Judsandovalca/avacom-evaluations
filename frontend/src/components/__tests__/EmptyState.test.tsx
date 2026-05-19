import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the message', () => {
    render(<EmptyState message="No courses yet." />);
    expect(screen.getByText('No courses yet.')).toBeInTheDocument();
  });
});
