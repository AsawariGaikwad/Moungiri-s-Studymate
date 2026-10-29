import { Link } from 'react-router-dom'
import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import { formatNumber } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

export default function MockTests() {
  const list = useGet(['tests'], '/tests')
  const rows = Array.isArray(list.data?.data) ? list.data.data : []

  return (
    <div>
      <PageHeader title="Mock Tests" description="Start a test or review a completed attempt." />
      {list.isLoading ? <CardSkeleton count={4} /> : null}
      {list.isError ? <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? (
        <EmptyState title="No tests yet" description="When a test is published for your batch, it will appear here." />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((test) => {
          const attempt = test.attempt
          return (
            <div key={test.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-brand-900 dark:text-white">{test.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{test.description}</p>
                </div>
                <Badge>{test.duration_minutes ? `${test.duration_minutes} min` : 'Timed'}</Badge>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Window: {formatDate(test.start_at, { withTime: true })} – {formatDate(test.end_at, { withTime: true })}
              </p>
              {attempt ? (
                <p className="mt-2 text-sm">
                  {attempt.status}: {formatNumber(attempt.score)} / {formatNumber(attempt.total_marks)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Not attempted</p>
              )}
              <div className="mt-4 flex gap-2">
                {!attempt ? (
                  <Button as={Link} to={`/tests/${test.id}/take`}>
                    Start
                  </Button>
                ) : (
                  <Button as={Link} to={`/tests/${test.id}/result`} variant="outline">
                    View result
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
