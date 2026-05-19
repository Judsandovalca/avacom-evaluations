import { useState } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';

interface Props<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, pageSize = 10, emptyMessage = 'No items yet.' }: Props<T>) {
  const [pageIndex, setPageIndex] = useState(0);

  // TanStack Table returns functions the React Compiler cannot safely memoize.
  // We don't run the Compiler, so this is informational only.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function'
        ? updater({ pageIndex, pageSize })
        : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-left text-slate-600 border-b border-slate-200">
                {hg.headers.map((header) => {
                  const extra = (header.column.columnDef.meta as { className?: string } | undefined)?.className ?? '';
                  return (
                    <th key={header.id} className={`py-2 px-4 font-medium ${extra}`}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => {
                  const extra = (cell.column.columnDef.meta as { className?: string } | undefined)?.className ?? '';
                  return (
                    <td key={cell.id} className={`py-2 px-4 ${extra}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={table.getState().pagination.pageIndex + 1}
        pageCount={table.getPageCount()}
        onPageChange={(p) => setPageIndex(p - 1)}
      />
    </div>
  );
}
