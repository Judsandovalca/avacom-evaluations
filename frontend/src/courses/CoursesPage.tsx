import { useState } from 'react';
import { AxiosError } from 'axios';
import type { ColumnDef } from '@tanstack/react-table';
import { useCourses } from './hooks/useCourses';
import { useCreateCourse } from './hooks/useCreateCourse';
import { useUpdateCourse } from './hooks/useUpdateCourse';
import { useDeleteCourse } from './hooks/useDeleteCourse';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AppNav } from '../components/AppNav';
import { PageShell } from '../components/PageShell';
import { PageHeader } from '../components/PageHeader';
import { ErrorAlert } from '../components/ErrorAlert';
import { DataTable } from '../components/DataTable';
import { useToast } from '../components/ToastContext';
import { EditCourseDialog } from './EditCourseDialog';
import { DeleteCourseDialog } from './DeleteCourseDialog';
import type { Course } from './types';

function conflictMsg(err: unknown, fallback: string): string {
  const status = err instanceof AxiosError ? err.response?.status : undefined;
  return status === 409 ? 'A course with that name already exists' : fallback;
}

export function CoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useCourses();
  const createMut = useCreateCourse();
  const updateMut = useUpdateCourse();
  const deleteMut = useDeleteCourse();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const { show } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createMut.mutateAsync({ name: name.trim() });
      show(`Course "${name.trim()}" created`, 'success');
      setName('');
    } catch (err: unknown) {
      show(conflictMsg(err, 'Could not create course'), 'error');
    }
  }

  async function handleEditSave(newName: string) {
    if (!editing) return;
    try {
      await updateMut.mutateAsync({ courseId: editing.courseId, name: newName });
      show(`Course renamed to "${newName}"`, 'success');
      setEditing(null);
    } catch (err: unknown) {
      show(conflictMsg(err, 'Could not rename course'), 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    try {
      await deleteMut.mutateAsync(deleting.courseId);
      show(`Course "${deleting.name}" deleted`, 'success');
      setDeleting(null);
    } catch {
      show('Could not delete course', 'error');
    }
  }

  const columns: ColumnDef<Course>[] = [
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
    {
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right space-x-3">
          <button
            type="button"
            onClick={() => setEditing(row.original)}
            className="text-brand-600 hover:underline text-sm"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleting(row.original)}
            className="text-red-600 hover:underline text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

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

        <EditCourseDialog
          course={editing}
          onSave={handleEditSave}
          onCancel={() => setEditing(null)}
          loading={updateMut.isPending}
        />
        <DeleteCourseDialog
          course={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleting(null)}
          loading={deleteMut.isPending}
        />
      </PageShell>
    </>
  );
}
