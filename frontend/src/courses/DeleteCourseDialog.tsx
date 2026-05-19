import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import type { Course } from './types';

interface Props {
  course: Course | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteCourseDialog({ course, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal open={!!course} onClose={onCancel} title="Delete course">
      <p className="text-sm text-slate-700 mb-2">
        Are you sure you want to delete <span className="font-semibold">{course?.name}</span>?
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Existing evaluations that reference this course keep their reference. This action can be reversed by support.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} loading={loading} className="!bg-red-600 hover:!bg-red-700">Delete</Button>
      </div>
    </Modal>
  );
}
