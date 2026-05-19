import { useState } from 'react';
import { AxiosError } from 'axios';
import { useCourses } from './hooks/useCourses';
import { useCreateCourse } from './hooks/useCreateCourse';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AppNav } from '../components/AppNav';
import { PageShell } from '../components/PageShell';
import { PageHeader } from '../components/PageHeader';
import { ErrorAlert } from '../components/ErrorAlert';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/ToastContext';

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
        {courses && courses.length === 0 && <EmptyState message="No courses yet. Add one above." />}
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
    </>
  );
}
