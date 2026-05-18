// src/components/Button.tsx
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, disabled, children, className, ...rest }, ref,
) {
  const klass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  return (
    <button
      ref={ref}
      className={`${klass} ${className ?? ''}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
});
