// src/evaluations/FiltersBar.tsx
import { Select } from '../components/Select';
import { Input } from '../components/Input';
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
        <Input
          label="Course ID"
          id="filter-course"
          value={courseId ?? ''}
          onChange={(e) => onChange({ status, courseId: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
