// src/evaluations/EvaluationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { evaluationFormSchema, type EvaluationFormInput } from '../lib/schemas';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <Input label="Course ID" id="courseId" {...register('courseId')} error={errors.courseId?.message} />
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
