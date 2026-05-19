import { Link, Navigate } from 'react-router-dom';
import { useCourses } from './hooks/useCourses';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TopNav } from '../components/TopNav';
import { PageShell } from '../components/PageShell';
import { ErrorAlert } from '../components/ErrorAlert';
import { EmptyState } from '../components/EmptyState';

export function PublicCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: courses, isLoading, isError, refetch } = useCourses();

  if (authLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/evaluations" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav
        cta={
          <Link to="/evaluations/new">
            <Button>New evaluation</Button>
          </Link>
        }
      />
      <PageShell maxWidth="3xl">
        <h1 className="text-2xl font-semibold text-slate-900">Available courses</h1>

        {isLoading && <LoadingSpinner />}
        {isError && <ErrorAlert message="Could not load courses." onRetry={refetch} />}
        {courses && courses.length === 0 && <EmptyState message="No courses yet." />}
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
      </PageShell>
    </div>
  );
}
