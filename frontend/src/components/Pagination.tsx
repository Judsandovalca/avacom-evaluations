interface Props {
  page: number;          // 1-based current page
  pageCount: number;
  onPageChange: (page: number) => void;
}

// Build a compact page list with ellipses, e.g. [1, '…', 4, 5, 6, '…', 12]
function buildPages(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, page - 1, page, page + 1]);
  const visible = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

  const out: (number | '…')[] = [];
  for (let i = 0; i < visible.length; i++) {
    if (i > 0 && visible[i] - visible[i - 1] > 1) out.push('…');
    out.push(visible[i]);
  }
  return out;
}

export function Pagination({ page, pageCount, onPageChange }: Props) {
  if (pageCount <= 1) return null;
  const pages = buildPages(page, pageCount);

  return (
    <nav className="flex items-center justify-end gap-1" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost px-2 py-1 disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Previous page"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={
              p === page
                ? 'inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-brand-600 px-2 text-sm font-medium text-white'
                : 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium text-slate-700 hover:bg-slate-100'
            }
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className="btn-ghost px-2 py-1 disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}
