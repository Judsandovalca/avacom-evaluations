import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  cta?: ReactNode;
}

export function TopNav({ cta }: Props) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          AVACOM Evaluations
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/signup" className="btn-secondary">Sign up</Link>
          {cta}
        </div>
      </div>
    </header>
  );
}
