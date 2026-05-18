// src/components/__tests__/Input.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders label associated with input', () => {
    render(<Input label="Email" id="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'email');
  });

  it('shows error message and aria-invalid', () => {
    render(<Input label="Email" id="email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards onChange', async () => {
    let val = '';
    render(<Input label="x" id="x" onChange={(e) => { val = e.target.value; }} />);
    await userEvent.type(screen.getByLabelText('x'), 'hi');
    expect(val).toBe('hi');
  });
});
