// src/evaluations/EvaluationsTable.tsx
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../components/DataTable';
import { useCourses } from '../courses/hooks/useCourses';
import type { Evaluation } from './types';

interface Props {
  items: Evaluation[];
  onDelete: (id: string) => void;
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function EvaluationsTable({ items, onDelete }: Props) {
  const { data: courses } = useCourses();
  const courseNameById = new Map((courses ?? []).map((c) => [c.courseId, c.name]));

  const columns: ColumnDef<Evaluation>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.title}</span>,
    },
    {
      accessorKey: 'courseId',
      header: 'Course',
      cell: ({ row }) => courseNameById.get(row.original.courseId) ?? row.original.courseId,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due',
      cell: ({ row }) => new Date(row.original.dueDate).toLocaleString(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusBadge[row.original.status]}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right space-x-3">
          <Link to={`/evaluations/${row.original.evaluationId}/edit`} className="text-brand-600 hover:underline text-sm">
            Edit
          </Link>
          <button
            type="button"
            onClick={() => onDelete(row.original.evaluationId)}
            className="text-red-600 hover:underline text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      pageSize={10}
      emptyMessage="No evaluations yet. Create your first one."
    />
  );
}
