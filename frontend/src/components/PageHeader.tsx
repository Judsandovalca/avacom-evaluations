import type { ReactNode } from 'react';

interface Props {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {actions && <div className="flex gap-3 items-center">{actions}</div>}
    </div>
  );
}
