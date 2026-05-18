// src/evaluations/EvaluationsTable.tsx
import { Link } from 'react-router-dom';
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
  if (items.length === 0) {
    return <p className="text-slate-500 italic">No evaluations yet. Create your first one.</p>;
  }
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left text-slate-600 border-b border-slate-200">
          <th className="py-2 pr-4">Title</th>
          <th className="py-2 pr-4">Course</th>
          <th className="py-2 pr-4">Due</th>
          <th className="py-2 pr-4">Status</th>
          <th className="py-2 pr-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((e) => (
          <tr key={e.evaluationId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-2 pr-4 font-medium text-slate-900">{e.title}</td>
            <td className="py-2 pr-4">{e.courseId}</td>
            <td className="py-2 pr-4">{new Date(e.dueDate).toLocaleString()}</td>
            <td className="py-2 pr-4">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusBadge[e.status]}`}>{e.status}</span>
            </td>
            <td className="py-2 pr-4 text-right space-x-2">
              <Link to={`/evaluations/${e.evaluationId}/edit`} className="text-brand-600 hover:underline text-sm">Edit</Link>
              <button onClick={() => onDelete(e.evaluationId)} className="text-red-600 hover:underline text-sm">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
