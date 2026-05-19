import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageShell } from '../PageShell';

describe('PageShell', () => {
  it('renders children inside a main landmark', () => {
    render(<PageShell><p>Body content</p></PageShell>);
    const main = screen.getByRole('main');
    expect(main).toContainHTML('<p>Body content</p>');
  });

  it('applies the 5xl max-width by default', () => {
    render(<PageShell><span /></PageShell>);
    expect(screen.getByRole('main').className).toContain('max-w-5xl');
  });

  it('applies a 3xl max-width when requested', () => {
    render(<PageShell maxWidth="3xl"><span /></PageShell>);
    expect(screen.getByRole('main').className).toContain('max-w-3xl');
  });
});
