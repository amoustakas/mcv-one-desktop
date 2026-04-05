import { useRef, useState, useCallback, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import Skeleton from './Skeleton';

interface ColumnDef<T> {
  key: string;
  header: string;
  width?: number | string;
  minWidth?: number;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

type SortDirection = 'asc' | 'desc';
interface SortState { key: string; direction: SortDirection; }

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: keyof T | ((row: T) => string);
  isLoading?: boolean;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;
  rowHeight?: number;
  maxHeight?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

const OVERSCAN = 5;

function getKey<T>(row: T, rowKey: keyof T | ((row: T) => string)): string {
  if (typeof rowKey === 'function') return rowKey(row);
  return String(row[rowKey]);
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  isLoading = false,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  sortState,
  onSortChange,
  rowHeight = 40,
  maxHeight = 600,
  onRowClick,
  emptyMessage = 'No data',
  className,
}: DataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
  }, []);

  const totalHeight = data.length * rowHeight;
  const visibleCount = Math.ceil(maxHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endIndex = Math.min(data.length, startIndex + visibleCount + OVERSCAN * 2);
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = Math.max(0, (data.length - endIndex) * rowHeight);

  const visibleRows = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  const allSelected = data.length > 0 && selectedKeys?.size === data.length;
  const someSelected = (selectedKeys?.size ?? 0) > 0 && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row) => getKey(row, rowKey))));
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  const handleSortClick = (col: ColumnDef<T>) => {
    if (!col.sortable || !onSortChange) return;
    const direction: SortDirection =
      sortState?.key === col.key && sortState.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: col.key, direction });
  };

  const colStyle = (col: ColumnDef<T>) => ({
    width: col.width ?? undefined,
    minWidth: col.minWidth ?? 60,
    flex: col.width ? `0 0 ${typeof col.width === 'number' ? `${col.width}px` : col.width}` : '1 1 0',
    textAlign: col.align ?? ('left' as const),
  });

  if (isLoading) {
    return (
      <div className={cn('mcv-table-wrap', className)}>
        <div className="mcv-table-header">
          {selectable && <div className="mcv-table-cell" style={{ flex: '0 0 40px' }} />}
          {columns.map((col) => (
            <div key={col.key} className="mcv-table-header-cell" style={colStyle(col)}>
              {col.header}
            </div>
          ))}
        </div>
        <div className="mcv-table-body">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mcv-table-row" style={{ height: rowHeight }}>
              {selectable && <div className="mcv-table-cell" style={{ flex: '0 0 40px' }}><Skeleton width={14} height={14} variant="rect" /></div>}
              {columns.map((col) => (
                <div key={col.key} className="mcv-table-cell" style={colStyle(col)}>
                  <Skeleton width="80%" height={12} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn('mcv-table-wrap', className)}>
        <div className="mcv-table-header">
          {columns.map((col) => (
            <div key={col.key} className="mcv-table-header-cell" style={colStyle(col)}>
              {col.header}
            </div>
          ))}
        </div>
        <div className="mcv-table-empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={cn('mcv-table-wrap', className)}>
      {/* Header */}
      <div className="mcv-table-header">
        {selectable && (
          <div className="mcv-table-cell" style={{ flex: '0 0 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="checkbox"
              className="mcv-table-checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={handleSelectAll}
            />
          </div>
        )}
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              'mcv-table-header-cell',
              sortState?.key === col.key && 'mcv-table-header-cell-active',
              !col.sortable && 'mcv-table-header-cell--nosort',
            )}
            style={{ ...colStyle(col), cursor: col.sortable ? 'pointer' : 'default' }}
            onClick={() => handleSortClick(col)}
          >
            {col.header}
            {col.sortable && sortState?.key === col.key && (
              <span className="mcv-table-header-cell-sort">
                {sortState.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Virtual-scrolled body */}
      <div
        ref={scrollRef}
        className="mcv-table-body"
        style={{ maxHeight, overflowY: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: paddingTop, left: 0, right: 0 }}>
            {visibleRows.map((row, vi) => {
              const key = getKey(row, rowKey);
              const globalIndex = startIndex + vi;
              const isSelected = selectedKeys?.has(key);
              return (
                <div
                  key={key}
                  className={cn('mcv-table-row', isSelected && 'mcv-table-row-selected')}
                  style={{ height: rowHeight, cursor: onRowClick ? 'pointer' : undefined }}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <div className="mcv-table-cell" style={{ flex: '0 0 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        className="mcv-table-checkbox"
                        checked={isSelected ?? false}
                        onChange={(e) => { e.stopPropagation(); handleSelectRow(key); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  {columns.map((col) => {
                    const cellValue = row[col.key];
                    return (
                      <div key={col.key} className="mcv-table-cell" style={colStyle(col)}>
                        {col.render
                          ? col.render(cellValue, row, globalIndex)
                          : cellValue != null ? String(cellValue) : ''}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* Padding bottom to preserve scroll height */}
          <div style={{ height: paddingBottom, visibility: 'hidden' }} />
        </div>
      </div>
    </div>
  );
}

export type { ColumnDef, SortDirection, SortState, DataTableProps };
