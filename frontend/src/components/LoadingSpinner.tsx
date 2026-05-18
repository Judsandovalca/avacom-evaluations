// src/components/LoadingSpinner.tsx
export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
