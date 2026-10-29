import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import { formatNumber, formatPercent } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import DataTable from '@/components/ui/DataTable'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

const tone = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'amber',
  LEAVE: 'slate',
}

export default function Attendance() {
  const mine = useGet(['attendance', 'my'], '/attendance/my')
  const data = mine.data?.data

  if (mine.isLoading) return <CardSkeleton count={3} />
  if (mine.isError) return <ErrorState message={getErrorMessage(mine.error)} onRetry={() => mine.refetch()} />
  if (!data) return <EmptyState title="No attendance yet" />

  const subjects = Array.isArray(data.subjects) ? data.subjects : []
  const recent = Array.isArray(data.recent) ? data.recent : []

  return (
    <div>
      <PageHeader title="Attendance" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Overall" value={formatPercent(data.overall_percentage)} />
        <StatCard label="Total classes" value={formatNumber(data.total_classes)} />
      </div>
      <h2 className="mb-2 font-semibold">By subject</h2>
      <div className="card mb-6 p-4">
        <DataTable
          columns={[
            { key: 'subject_name', header: 'Subject' },
            { key: 'attended', header: 'Attended' },
            { key: 'total', header: 'Total' },
            { key: 'percentage', header: '%', render: (row) => formatPercent(row.percentage) },
          ]}
          rows={subjects}
          emptyTitle="No subject attendance yet"
        />
      </div>
      <h2 className="mb-2 font-semibold">Recent</h2>
      <div className="card p-4">
        <DataTable
          columns={[
            { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
            { key: 'subject_name', header: 'Subject' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={tone[row.status] || 'slate'}>{row.status || '—'}</Badge>,
            },
          ]}
          rows={recent}
          emptyTitle="No recent records yet"
        />
      </div>
    </div>
  )
}
