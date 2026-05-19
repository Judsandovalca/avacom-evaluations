// src/evaluations/EvaluationsListPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AppNav } from '../components/AppNav';
import { PageShell } from '../components/PageShell';
import { PageHeader } from '../components/PageHeader';
import { ErrorAlert } from '../components/ErrorAlert';
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
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          title="Evaluations"
          actions={<Link to="/evaluations/new" className="btn-primary">New evaluation</Link>}
        />

        <FiltersBar status={filters.status} courseId={filters.courseId} onChange={setFilters} />

        {isLoading && <LoadingSpinner />}
        {isError && <ErrorAlert message="Could not load evaluations." onRetry={refetch} />}
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
      </PageShell>
    </>
  );
}
