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
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={`input-base appearance-none pr-9 cursor-pointer ${error ? 'border-red-500' : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-slate-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
