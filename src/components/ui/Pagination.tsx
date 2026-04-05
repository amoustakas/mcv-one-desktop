import { useMemo } from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const left = Math.max(2, page - 1);
      const right = Math.min(totalPages - 1, page + 1);

      if (left > 2) pages.push('ellipsis');
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className={cn('mcv-pagination', className)}>
      <span className="mcv-pagination-info">
        {total === 0 ? 'No results' : `${start}-${end} of ${total.toLocaleString()}`}
      </span>

      <div className="mcv-pagination-controls">
        <button
          className="mcv-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          title="First page"
          type="button"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          className="mcv-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous page"
          type="button"
        >
          <ChevronLeft size={14} />
        </button>

        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ell-${i}`} className="mcv-pagination-btn" style={{ cursor: 'default', opacity: 0.4 }}>
              ...
            </span>
          ) : (
            <button
              key={p}
              className={cn('mcv-pagination-btn', p === page && 'mcv-pagination-btn-active')}
              onClick={() => onPageChange(p)}
              type="button"
            >
              {p}
            </button>
          ),
        )}

        <button
          className="mcv-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next page"
          type="button"
        >
          <ChevronRight size={14} />
        </button>
        <button
          className="mcv-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
          type="button"
        >
          <ChevronsRight size={14} />
        </button>
      </div>

      {onPageSizeChange && (
        <div className="mcv-pagination-size">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export type { PaginationProps };
