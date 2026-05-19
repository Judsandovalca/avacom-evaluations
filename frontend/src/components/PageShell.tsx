import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  maxWidth?: '3xl' | '5xl';
}

const widthClass = {
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
} as const;

export function PageShell({ children, maxWidth = '5xl' }: Props) {
  return (
    <main className={`${widthClass[maxWidth]} mx-auto p-6 space-y-6`}>
      {children}
    </main>
  );
}
