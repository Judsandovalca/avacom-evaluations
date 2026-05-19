import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import { useToast } from './ToastContext';

const links = [
  { to: '/evaluations', label: 'Evaluations' },
  { to: '/courses', label: 'Courses' },
];

export function AppNav() {
  const { user, setUser } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/login');
    } catch {
      show('Could not log out', 'error');
    }
  }

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/evaluations" className="text-lg font-semibold text-slate-900">
          AVACOM Evaluations
        </Link>
        <nav className="flex items-center gap-4">
          {links.map(({ to, label }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`text-sm ${active ? 'text-brand-600 font-medium' : 'text-slate-700 hover:text-brand-600'}`}
              >
                {label}
              </Link>
            );
          })}
          {user && (
            <>
              <span className="text-sm text-slate-500" aria-label="Signed in as">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
