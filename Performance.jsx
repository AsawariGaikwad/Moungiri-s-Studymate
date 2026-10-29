import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { useGet } from '@/hooks/useGet'
import { useOptions } from '@/hooks/useOptions'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import { formatPercent } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'

export default function Performance() {
  const { user } = useAuth()
  if (user?.role === 'STUDENT') return <StudentCharts />
  return <StaffPerformance />
}

function StudentCharts() {
  const mine = useGet(['performance', 'my'], '/performance/my')
  const rows = Array.isArray(mine.data?.data) ? mine.data.data : []
  const chart = useMemo(
    () =>
      rows.map((row) => ({
        name: row.test_title,
        percentage: Number(row.percentage) || 0,
      })),
    [rows],
  )

  if (mine.isLoading) return <CardSkeleton count={2} />
  if (mine.isError) return <ErrorState message={getErrorMessage(mine.error)} onRetry={() => mine.refetch()} />

  return (
    <div>
      <PageHeader title="Performance" />
      {rows.length === 0 ? <EmptyState title="No test results yet" /> : null}
      {rows.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-4">
            <h2 className="mb-3 font-semibold">Score trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#1e4da8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4">
            <h2 className="mb-3 font-semibold">By test</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
      <div className="card mt-4 p-4">
        <DataTable
          columns={[
            { key: 'test_title', header: 'Test' },
            { key: 'score', header: 'Score' },
            { key: 'total_marks', header: 'Total' },
            { key: 'percentage', header: '%', render: (row) => formatPercent(row.percentage) },
            { key: 'submitted_at', header: 'Submitted', render: (row) => formatDate(row.submitted_at, { withTime: true }) },
          ]}
          rows={rows}
          emptyTitle="No test results yet"
        />
      </div>
    </div>
  )
}

function StaffPerformance() {
  const [batchId, setBatchId] = useState('')
  const batches = useOptions('/batches', { map: { value: 'id', label: 'name' } })
  const list = useGet(['performance', 'students'], '/performance/students', { batch_id: batchId || undefined }, { enabled: Boolean(batchId) })
  const rows = Array.isArray(list.data?.data) ? list.data.data : []

  return (
    <div>
      <PageHeader title="Student Performance" />
      <select className="input mb-4 max-w-xs" value={batchId} onChange={(e) => setBatchId(e.target.value)} aria-label="Batch">
        <option value="">Select a batch</option>
        {batches.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {!batchId ? <EmptyState title="Choose a batch" description="Performance appears after you select a batch." /> : null}
      {batchId ? (
        <div className="card p-4">
          <DataTable
            columns={[
              { key: 'full_name', header: 'Name' },
              { key: 'roll_no', header: 'Roll no' },
              { key: 'attendance_percentage', header: 'Attendance', render: (row) => formatPercent(row.attendance_percentage) },
              { key: 'average_score_percentage', header: 'Avg score', render: (row) => formatPercent(row.average_score_percentage) },
              { key: 'tests_taken', header: 'Tests taken' },
            ]}
            rows={rows}
            loading={list.isLoading}
            error={list.isError ? getErrorMessage(list.error) : null}
            onRetry={() => list.refetch()}
            emptyTitle="No performance data yet"
          />
        </div>
      ) : null}
    </div>
  )
}
