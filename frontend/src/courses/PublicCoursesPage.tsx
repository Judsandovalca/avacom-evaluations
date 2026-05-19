import { Link, Navigate } from 'react-router-dom';
import { useCourses } from './hooks/useCourses';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function PublicCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: courses, isLoading, isError, refetch } = useCourses();

  if (authLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/evaluations" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">AVACOM Evaluations</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-brand-600 hover:underline text-sm">Log in</Link>
            <Link to="/evaluations/new">
              <Button>New evaluation</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Available courses</h1>

        {isLoading && <LoadingSpinner />}
        {isError && (
          <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-red-700">Could not load courses.</p>
            <Button variant="secondary" onClick={() => refetch()} className="mt-2">Retry</Button>
          </div>
        )}
        {courses && courses.length === 0 && (
          <p className="text-slate-500 italic">No courses yet.</p>
        )}
        {courses && courses.length > 0 && (
          <ul className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
            {courses.map((c, i) => (
              <li key={c.courseId} className="p-4 flex items-center gap-4">
                <span className="font-mono text-slate-400 w-8 text-right">#{i + 1}</span>
                <span className="font-medium text-slate-900">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
