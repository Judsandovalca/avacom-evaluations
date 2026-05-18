// src/evaluations/DeleteConfirmDialog.tsx
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

interface Props {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmDialog({ open, title, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete evaluation">
      <p className="text-sm text-slate-700 mb-4">
        Are you sure you want to delete <span className="font-semibold">{title}</span>? This action can be reversed by support.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} loading={loading} className="!bg-red-600 hover:!bg-red-700">Delete</Button>
      </div>
    </Modal>
  );
}
