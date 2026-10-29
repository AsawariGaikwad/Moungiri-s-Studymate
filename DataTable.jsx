import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records yet',
  emptyDescription,
  page,
  pages,
  total,
  onPageChange,
  rowKey = 'id',
}) {
  if (loading) return <TableSkeleton rows={6} cols={Math.max(columns.length, 3)} />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />

  const current = page || 1
  const last = pages || 1

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {columns.map((col) => (
                <th key={col.key} className={cn('whitespace-nowrap px-3 py-3 font-medium', col.headerClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-3 py-3 align-middle text-slate-700 dark:text-slate-200', col.className)}>
                    {col.render ? col.render(row, index) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 || total != null ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <p>{total != null ? `${total} total` : null}</p>
          {pages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="px-2"
                disabled={current <= 1}
                onClick={() => onPageChange?.(current - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Page {current} of {last}
              </span>
              <Button
                variant="outline"
                className="px-2"
                disabled={current >= last}
                onClick={() => onPageChange?.(current + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
