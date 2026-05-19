import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders the title as h1', () => {
    render(<PageHeader title="My Page" />);
    expect(screen.getByRole('heading', { level: 1, name: 'My Page' })).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(<PageHeader title="X" actions={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
