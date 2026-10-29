import { useMemo, useState } from 'react'
import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { CardSkeleton } from '@/components/ui/Skeleton'

export default function MyBatches() {
  const assignments = useGet(['my-assignments'], '/my-assignments')
  const items = Array.isArray(assignments.data?.data) ? assignments.data.data : []
  const batches = useMemo(() => {
    const map = new Map()
    items.forEach((item) => {
      if (!map.has(item.batch_id)) {
        map.set(item.batch_id, { id: item.batch_id, name: item.batch_name, subjects: [] })
      }
      map.get(item.batch_id).subjects.push(item.subject_name)
    })
    return [...map.values()]
  }, [items])
  const [batchId, setBatchId] = useState('')
  const [q, setQ] = useState('')
  const students = useGet(
    ['students', batchId, q],
    '/students',
    { batch_id: batchId, q: q || undefined, page: 1, per_page: 50 },
    { enabled: Boolean(batchId) },
  )

  if (assignments.isLoading) return <CardSkeleton count={3} />
  if (assignments.isError) return <ErrorState message={getErrorMessage(assignments.error)} onRetry={() => assignments.refetch()} />

  return (
    <div>
      <PageHeader title="My Students / Batches" />
      {batches.length === 0 ? <EmptyState title="No assigned batches yet" /> : null}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {batches.map((batch) => (
          <button
            key={batch.id}
            type="button"
            onClick={() => setBatchId(String(batch.id))}
            className={`card p-4 text-left ${String(batch.id) === String(batchId) ? 'ring-2 ring-brand-500' : ''}`}
          >
            <p className="font-semibold">{batch.name}</p>
            <p className="text-sm text-slate-500">{batch.subjects.filter(Boolean).join(', ') || '—'}</p>
          </button>
        ))}
      </div>
      {batchId ? (
        <div className="card p-4">
          <form
            className="mb-3"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              setQ(String(fd.get('q') || ''))
            }}
          >
            <input name="q" className="input max-w-sm" placeholder="Search students" defaultValue={q} />
          </form>
          <DataTable
            columns={[
              { key: 'full_name', header: 'Name' },
              { key: 'roll_no', header: 'Roll no' },
            ]}
            rows={Array.isArray(students.data?.data) ? students.data.data : []}
            loading={students.isLoading}
            error={students.isError ? getErrorMessage(students.error) : null}
            onRetry={() => students.refetch()}
            emptyTitle="No students yet"
          />
        </div>
      ) : batches.length > 0 ? (
        <EmptyState title="Select a batch" description="Choose a batch card to see its students." />
      ) : null}
    </div>
  )
}
