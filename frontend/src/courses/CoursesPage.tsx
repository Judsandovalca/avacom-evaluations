import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import type { ColumnDef } from '@tanstack/react-table';
import { useCourses } from './hooks/useCourses';
import { useCreateCourse } from './hooks/useCreateCourse';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AppNav } from '../components/AppNav';
import { PageShell } from '../components/PageShell';
import { PageHeader } from '../components/PageHeader';
import { ErrorAlert } from '../components/ErrorAlert';
import { DataTable } from '../components/DataTable';
import { useToast } from '../components/ToastContext';
import type { Course } from './types';

export function CoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useCourses();
  const createMut = useCreateCourse();
  const [name, setName] = useState('');
  const { show } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createMut.mutateAsync({ name: name.trim() });
      show(`Course "${name.trim()}" created`, 'success');
      setName('');
    } catch (err: unknown) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      const msg = status === 409
        ? 'A course with that name already exists'
        : 'Could not create course';
      show(msg, 'error');
    }
  }

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

  return (
    <>
      <AppNav />
      <PageShell maxWidth="3xl">
        <PageHeader title="Courses" />

        <form onSubmit={handleCreate} className="flex gap-3 items-end bg-white p-4 rounded-lg shadow-sm">
          <div className="flex-1">
            <Input
              label="New course name"
              id="new-course-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Machine Learning"
              disabled={createMut.isPending}
            />
          </div>
          <Button type="submit" loading={createMut.isPending} disabled={!name.trim()}>
            Add course
          </Button>
        </form>

        {isLoading && <LoadingSpinner />}
        {isError && <ErrorAlert message="Could not load courses." onRetry={refetch} />}
        {courses && (
          <DataTable
            columns={columns}
            data={courses}
            pageSize={10}
            emptyMessage="No courses yet. Add one above."
          />
        )}
      </PageShell>
    </>
  );
}
