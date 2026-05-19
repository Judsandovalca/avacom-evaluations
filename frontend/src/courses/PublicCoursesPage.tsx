import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { useCourses } from './hooks/useCourses';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TopNav } from '../components/TopNav';
import { PageShell } from '../components/PageShell';
import { ErrorAlert } from '../components/ErrorAlert';
import { DataTable } from '../components/DataTable';
import type { Course } from './types';

export function PublicCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: courses, isLoading, isError, refetch } = useCourses();

  const columns = useMemo<ColumnDef<Course>[]>(() => [
    {
      id: 'rowNumber',
      header: () => <span className="block text-right">#</span>,
      cell: ({ row }) => (
        <span className="font-mono text-slate-400 block text-right w-8">#{row.index + 1}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>,
    },
  ], []);

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
        {courses && (
          <DataTable
            columns={columns}
            data={courses}
            pageSize={10}
            emptyMessage="No courses yet."
          />
        )}
      </PageShell>
    </div>
  );
}
