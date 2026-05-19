// src/evaluations/FiltersBar.tsx
import { Select } from '../components/Select';
import { useCourses } from '../courses/hooks/useCourses';
import type { EvaluationStatus } from './types';

interface Props {
  status?: EvaluationStatus;
  courseId?: string;
  onChange: (next: { status?: EvaluationStatus; courseId?: string }) => void;
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function FiltersBar({ status, courseId, onChange }: Props) {
  const { data: courses, isLoading } = useCourses();
  const courseOptions = [
    { value: '', label: 'All courses' },
    ...(courses ?? []).map((c) => ({ value: c.courseId, label: c.name })),
  ];

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="w-48">
        <Select
          label="Status"
          id="filter-status"
          options={statusOptions}
          value={status ?? ''}
          onChange={(e) => onChange({ status: (e.target.value || undefined) as EvaluationStatus | undefined, courseId })}
        />
      </div>
      <div className="w-48">
        <Select
          label="Course"
          id="filter-course"
          options={courseOptions}
          value={courseId ?? ''}
          disabled={isLoading}
          onChange={(e) => onChange({ status, courseId: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
