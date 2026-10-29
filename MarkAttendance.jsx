import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import { todayISODate } from '@/lib/datetime'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import DataTable from '@/components/ui/DataTable'

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE']

export default function MarkAttendance() {
  const assignments = useGet(['my-assignments'], '/my-assignments')
  const items = Array.isArray(assignments.data?.data) ? assignments.data.data : []
  const [batchId, setBatchId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(todayISODate())
  const [marks, setMarks] = useState({})

  const subjectsForBatch = useMemo(
    () => items.filter((item) => String(item.batch_id) === String(batchId)),
    [items, batchId],
  )
  const batches = useMemo(() => {
    const map = new Map()
    items.forEach((item) => map.set(item.batch_id, item.batch_name))
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  }, [items])

  const roster = useGet(
    ['attendance', 'roster', batchId, subjectId, date],
    '/attendance/roster',
    { batch_id: batchId, subject_id: subjectId, date },
    { enabled: Boolean(batchId && subjectId && date) },
  )
  const rows = Array.isArray(roster.data?.data) ? roster.data.data : []

  const statusOf = (row) => marks[row.student_id] ?? row.status ?? ''

  const save = async () => {
    try {
      await api.post('/attendance/mark', {
        batch_id: Number(batchId),
        subject_id: Number(subjectId),
        date,
        records: rows.map((row) => ({
          student_id: row.student_id,
          status: statusOf(row) || 'ABSENT',
        })),
      })
      toast.success('Attendance saved')
      roster.refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Mark Attendance" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <select
          className="input"
          value={batchId}
          onChange={(e) => {
            setBatchId(e.target.value)
            setSubjectId('')
          }}
          aria-label="Batch"
        >
          <option value="">Batch</option>
          {batches.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Subject">
          <option value="">Subject</option>
          {subjectsForBatch.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.subject_name}
            </option>
          ))}
        </select>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      </div>
      {assignments.isError ? <ErrorState message={getErrorMessage(assignments.error)} onRetry={() => assignments.refetch()} /> : null}
      {!batchId || !subjectId ? <EmptyState title="Select batch, subject and date" /> : null}
      {batchId && subjectId ? (
        <div className="card p-4">
          <DataTable
            columns={[
              { key: 'roll_no', header: 'Roll no' },
              { key: 'full_name', header: 'Name' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <select
                    className="input"
                    value={statusOf(row)}
                    onChange={(e) => setMarks((m) => ({ ...m, [row.student_id]: e.target.value }))}
                    aria-label={`Status for ${row.full_name}`}
                  >
                    <option value="">Mark</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
            rows={rows}
            loading={roster.isLoading}
            error={roster.isError ? getErrorMessage(roster.error) : null}
            onRetry={() => roster.refetch()}
            emptyTitle="No students in this roster yet"
            rowKey="student_id"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={save} disabled={!rows.length}>
              Save attendance
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
