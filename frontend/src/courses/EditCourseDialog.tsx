import { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { Course } from './types';

interface Props {
  course: Course | null;
  onSave: (name: string) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

export function EditCourseDialog({ course, onSave, onCancel, loading }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    // Sync local input state when the parent opens the dialog for a
    // different course (or re-opens the same one after a save/cancel).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (course) setName(course.name);
  }, [course]);

  const trimmed = name.trim();
  const unchanged = trimmed === course?.name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || unchanged) return;
    await onSave(trimmed);
  }

  return (
    <Modal open={!!course} onClose={onCancel} title="Edit course">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Course name"
          id="edit-course-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={!trimmed || unchanged}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
