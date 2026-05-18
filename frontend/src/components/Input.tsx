// src/components/Input.tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, error, className, ...rest }, ref,
) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        ref={ref}
        id={id}
        className={`input-base ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
