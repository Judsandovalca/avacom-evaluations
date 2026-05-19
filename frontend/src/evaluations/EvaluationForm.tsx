// src/evaluations/EvaluationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { evaluationFormSchema, type EvaluationFormInput } from '../lib/schemas';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { useCourses } from '../courses/hooks/useCourses';

interface Props {
  initialValues?: EvaluationFormInput;
  submitting: boolean;
  onSubmit: (data: EvaluationFormInput) => void | Promise<void>;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EvaluationForm({ initialValues, submitting, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<EvaluationFormInput>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: initialValues ?? { courseId: '', title: '', description: '', dueDate: '', status: 'active' },
  });

  const { data: courses, isLoading: coursesLoading } = useCourses();
  const courseOptions = (courses ?? []).map((c) => ({ value: c.courseId, label: c.name }));

  if (!coursesLoading && courseOptions.length === 0) {
    return (
      <div className="max-w-2xl bg-amber-50 border border-amber-200 rounded-lg p-5 space-y-3">
        <h2 className="text-base font-semibold text-amber-900">No courses available</h2>
        <p className="text-sm text-amber-800">
          You need at least one course before creating an evaluation. Add one first
          and come back here.
        </p>
        <Link to="/courses" className="btn-primary inline-block">Go to courses</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div>
        {coursesLoading ? (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Course</label>
            <div className="input-base text-slate-400">Loading courses…</div>
          </div>
        ) : (
          <Select
            label="Course"
            id="courseId"
            options={courseOptions}
            placeholder="Select a course"
            {...register('courseId')}
            error={errors.courseId?.message}
          />
        )}
        <p className="text-xs text-slate-500 mt-1">
          Need a different one? <Link to="/courses" className="text-brand-600 hover:underline">Manage courses</Link>
        </p>
      </div>
      <Input label="Title" id="title" {...register('title')} error={errors.title?.message} />
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          id="description"
          rows={4}
          className="input-base"
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
      </div>
      <Input label="Due Date" id="dueDate" type="datetime-local" {...register('dueDate')} error={errors.dueDate?.message} />
      <Select label="Status" id="status" options={statusOptions} {...register('status')} error={errors.status?.message} />
      <Button type="submit" loading={submitting}>Save</Button>
    </form>
  );
}
