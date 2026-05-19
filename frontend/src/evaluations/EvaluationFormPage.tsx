// src/evaluations/EvaluationFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AppNav } from '../components/AppNav';
import { PageShell } from '../components/PageShell';
import { PageHeader } from '../components/PageHeader';
import { ErrorAlert } from '../components/ErrorAlert';
import { EvaluationForm } from './EvaluationForm';
import { useEvaluation } from './hooks/useEvaluation';
import { useCreateEvaluation } from './hooks/useCreateEvaluation';
import { useUpdateEvaluation } from './hooks/useUpdateEvaluation';
import { useToast } from '../components/ToastContext';
import type { EvaluationFormInput } from '../lib/schemas';

interface Props { mode: 'create' | 'edit'; }

export function EvaluationFormPage({ mode }: Props) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const id = params.id ?? '';

  const eval$ = useEvaluation(mode === 'edit' ? id : '');
  const createMut = useCreateEvaluation();
  const updateMut = useUpdateEvaluation();

  if (mode === 'edit' && eval$.isLoading) {
    return (
      <>
        <AppNav />
        <PageShell maxWidth="3xl"><LoadingSpinner /></PageShell>
      </>
    );
  }
  if (mode === 'edit' && eval$.isError) {
    return (
      <>
        <AppNav />
        <PageShell maxWidth="3xl"><ErrorAlert message="Could not load evaluation." /></PageShell>
      </>
    );
  }

  async function onSubmit(data: EvaluationFormInput) {
    // datetime-local gives "YYYY-MM-DDTHH:MM"; backend requires ISO 8601
    // with timezone. Convert local clock time to UTC ISO before sending.
    const payload = {
      ...data,
      dueDate: new Date(data.dueDate).toISOString(),
    };
    try {
      if (mode === 'create') {
        await createMut.mutateAsync(payload);
        show('Created', 'success');
      } else {
        await updateMut.mutateAsync({ id, patch: payload });
        show('Updated', 'success');
      }
      navigate('/evaluations');
    } catch {
      show('Save failed', 'error');
    }
  }

  const initial: EvaluationFormInput | undefined = mode === 'edit' && eval$.data
    ? {
        courseId: eval$.data.courseId,
        title: eval$.data.title,
        description: eval$.data.description,
        dueDate: eval$.data.dueDate.slice(0, 16),
        status: eval$.data.status,
      }
    : undefined;

  return (
    <>
      <AppNav />
      <PageShell maxWidth="3xl">
        <PageHeader title={mode === 'create' ? 'New evaluation' : 'Edit evaluation'} />
        <EvaluationForm
          initialValues={initial}
          submitting={createMut.isPending || updateMut.isPending}
          onSubmit={onSubmit}
        />
      </PageShell>
    </>
  );
}
