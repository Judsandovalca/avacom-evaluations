// src/components/Select.tsx
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectOption { value: string; label: string; }

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, options, error, placeholder, className, ...rest }, ref,
) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        ref={ref}
        id={id}
        className={`input-base ${error ? 'border-red-500' : ''} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
