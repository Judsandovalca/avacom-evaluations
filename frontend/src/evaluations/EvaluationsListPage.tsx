// src/evaluations/EvaluationsListPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useEvaluations } from './hooks/useEvaluations';
import { useDeleteEvaluation } from './hooks/useDeleteEvaluation';
import { FiltersBar } from './FiltersBar';
import { EvaluationsTable } from './EvaluationsTable';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useToast } from '../components/ToastContext';
import type { EvaluationStatus } from './types';

export function EvaluationsListPage() {
  const [filters, setFilters] = useState<{ status?: EvaluationStatus; courseId?: string }>({});
  const { data, isLoading, isError, refetch } = useEvaluations(filters);
  const deleteMut = useDeleteEvaluation();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const { show } = useToast();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      show('Evaluation deleted', 'success');
    } catch {
      show('Could not delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Evaluations</h1>
        <div className="flex gap-3 items-center">
          <Link to="/courses" className="text-brand-600 hover:underline text-sm">Manage courses</Link>
          <Link to="/evaluations/new" className="btn-primary">New evaluation</Link>
        </div>
      </div>

      <FiltersBar status={filters.status} courseId={filters.courseId} onChange={setFilters} />

      {isLoading && <LoadingSpinner />}
      {isError && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-700">Could not load evaluations.</p>
          <Button variant="secondary" onClick={() => refetch()} className="mt-2">Retry</Button>
        </div>
      )}
      {data && (
        <EvaluationsTable
          items={data.items}
          onDelete={(id) => {
            const item = data.items.find(i => i.evaluationId === id);
            if (item) setDeleteTarget({ id, title: item.title });
          }}
        />
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.title ?? ''}
        loading={deleteMut.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
