import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';

interface Row { id: number; name: string; }

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

const rows: Row[] = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

describe('DataTable', () => {
  it('renders headers and the first page of rows', () => {
    render(<DataTable columns={columns} data={rows} pageSize={10} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 10')).toBeInTheDocument();
    expect(screen.queryByText('Item 11')).toBeNull();
  });

  it('navigates between pages via the Pagination control', async () => {
    render(<DataTable columns={columns} data={rows} pageSize={10} />);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Item 11')).toBeInTheDocument();
    expect(screen.getByText('Item 20')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).toBeNull();
  });

  it('shows the empty state when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here yet." />);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
    expect(screen.queryByText('ID')).toBeNull();
  });

  it('does not render pagination when data fits in one page', () => {
    render(<DataTable columns={columns} data={rows.slice(0, 5)} pageSize={10} />);
    expect(screen.queryByLabelText('Pagination')).toBeNull();
  });
});
