// src/components/__tests__/Select.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
  ];

  it('renders label and options', () => {
    render(<Select label="Fruit" id="fruit" options={options} />);
    expect(screen.getByLabelText('Fruit')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('fires onChange with new value', async () => {
    let val = '';
    render(<Select label="Fruit" id="fruit" options={options} onChange={(e) => { val = e.target.value; }} />);
    await userEvent.selectOptions(screen.getByLabelText('Fruit'), 'b');
    expect(val).toBe('b');
  });

  it('shows error', () => {
    render(<Select label="Fruit" id="fruit" options={options} error="pick one" />);
    expect(screen.getByText('pick one')).toBeInTheDocument();
  });
});
