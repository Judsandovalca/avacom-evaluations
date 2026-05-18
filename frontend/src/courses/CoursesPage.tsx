import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from './hooks/useCourses';
import { useCreateCourse } from './hooks/useCreateCourse';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../components/ToastProvider';

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
    } catch (err: any) {
      const msg = err?.response?.status === 409
        ? 'A course with that name already exists'
        : 'Could not create course';
      show(msg, 'error');
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Courses</h1>
        <Link to="/evaluations" className="text-brand-600 hover:underline text-sm">
          Back to evaluations
        </Link>
      </div>

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
      {isError && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-700">Could not load courses.</p>
          <Button variant="secondary" onClick={() => refetch()} className="mt-2">Retry</Button>
        </div>
      )}
      {courses && courses.length === 0 && (
        <p className="text-slate-500 italic">No courses yet. Add one above.</p>
      )}
      {courses && courses.length > 0 && (
        <ul className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
          {courses.map((c) => (
            <li key={c.courseId} className="p-4 flex justify-between items-center">
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="text-xs text-slate-400 font-mono">{c.courseId.slice(0, 8)}…</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
