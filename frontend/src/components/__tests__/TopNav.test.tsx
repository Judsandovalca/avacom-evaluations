import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../../__tests__/test-utils';
import { TopNav } from '../TopNav';

describe('TopNav', () => {
  it('renders Log in and Sign up links', () => {
    renderWithProviders(<TopNav />);
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
  });

  it('renders the cta slot when provided', () => {
    renderWithProviders(<TopNav cta={<button>Custom CTA</button>} />);
    expect(screen.getByRole('button', { name: 'Custom CTA' })).toBeInTheDocument();
  });

  it('links the app name to the root', () => {
    renderWithProviders(<TopNav />);
    expect(screen.getByRole('link', { name: /avacom evaluations/i })).toHaveAttribute('href', '/');
  });
});
