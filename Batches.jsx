import { useState } from 'react'
import api from '@/api/client'
import { useGet } from '@/hooks/useGet'
import { useAction } from '@/hooks/useAction'
import { useOptions } from '@/hooks/useOptions'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import DynamicForm from '@/components/ui/DynamicForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Badge from '@/components/ui/Badge'

const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'class_level', label: 'Class level', type: 'text', required: true },
  { name: 'academic_year', label: 'Academic year', type: 'text', required: true },
  { name: 'start_date', label: 'Start date', type: 'date' },
  { name: 'end_date', label: 'End date', type: 'date' },
  { name: 'is_active', label: 'Active', type: 'checkbox' },
]

export default function Batches() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [serverError, setServerError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [assignFor, setAssignFor] = useState(null)
  const [assignError, setAssignError] = useState(null)
  const [removeAssign, setRemoveAssign] = useState(null)

  const list = useGet(['batches'], '/batches', { page, per_page: 10, q: q || undefined })
  const rows = Array.isArray(list.data?.data) ? list.data.data : []
  const meta = list.data?.meta
  const faculty = useOptions('/users', {
    params: { role: 'FACULTY', per_page: 100 },
    map: (u) => ({ value: u.faculty?.id, label: u.full_name }),
  })
  const subjects = useOptions('/subjects')

  const save = useAction({
    mutationFn: ({ id, payload }) => (id ? api.patch(`/batches/${id}`, payload) : api.post('/batches', payload)),
    invalidate: ['batches'],
    successMessage: 'Saved',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setOpen(false)
      setEditing(null)
      setServerError(null)
    },
  })
  const remove = useAction({
    mutationFn: (row) => api.delete(`/batches/${row.id}`),
    invalidate: ['batches'],
    successMessage: 'Deleted',
  })
  const assign = useAction({
    mutationFn: ({ batchId, payload }) => api.post(`/batches/${batchId}/assignments`, payload),
    invalidate: ['batches'],
    successMessage: 'Faculty assigned',
    silentError: true,
    onError: (err) => setAssignError(err),
    onSuccess: () => {
      setAssignFor(null)
      setAssignError(null)
    },
  })
  const unassign = useAction({
    mutationFn: (row) => api.delete(`/assignments/${row.id}`),
    invalidate: ['batches'],
    successMessage: 'Assignment removed',
  })

  return (
    <div>
      <PageHeader
        title="Batches"
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); setServerError(null) }}>New batch</Button>
        }
      />
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQ(draft)
        }}
      >
        <input className="input max-w-sm" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="card p-4">
        <DataTable
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'class_level', header: 'Class' },
            { key: 'academic_year', header: 'Year' },
            { key: 'student_count', header: 'Students' },
            {
              key: 'assignments',
              header: 'Faculty',
              render: (row) => (
                <ul className="space-y-1 text-sm">
                  {(row.assignments || []).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <span>
                        {a.faculty_name} · {a.subject_name}
                      </span>
                      <button type="button" className="text-red-600" onClick={() => setRemoveAssign(a)}>
                        Remove
                      </button>
                    </li>
                  ))}
                  {!(row.assignments || []).length ? <span className="text-slate-400">—</span> : null}
                </ul>
              ),
            },
            { key: 'dates', header: 'Dates', render: (row) => `${formatDate(row.start_date)} – ${formatDate(row.end_date)}` },
            { key: 'is_active', header: 'Active', render: (row) => <Badge tone={row.is_active ? 'green' : 'slate'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <Button variant="outline" className="px-2" onClick={() => setAssignFor(row)}>Assign</Button>
                  <Button variant="outline" className="px-2" onClick={() => { setEditing(row); setOpen(true) }}>Edit</Button>
                  <Button variant="ghost" className="px-2 text-red-600" onClick={() => setDeleting(row)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={list.isLoading}
          error={list.isError ? getErrorMessage(list.error) : null}
          onRetry={() => list.refetch()}
          emptyTitle="No batches yet"
          page={meta?.page}
          pages={meta?.pages}
          total={meta?.total}
          onPageChange={setPage}
        />
      </div>
      <Modal open={open} title={editing ? 'Edit batch' : 'New batch'} onClose={() => setOpen(false)}>
        <DynamicForm
          fields={fields}
          defaultValues={editing || { is_active: true }}
          serverError={serverError}
          submitting={save.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={(payload) => save.mutateAsync({ id: editing?.id, payload })}
        />
      </Modal>
      <Modal open={Boolean(assignFor)} title={`Assign faculty · ${assignFor?.name || ''}`} onClose={() => setAssignFor(null)}>
        <DynamicForm
          fields={[
            { name: 'faculty_id', label: 'Faculty', type: 'select', required: true, options: faculty.options },
            { name: 'subject_id', label: 'Subject', type: 'select', required: true, options: subjects.options },
          ]}
          defaultValues={{}}
          serverError={assignError}
          submitting={assign.isPending}
          onCancel={() => setAssignFor(null)}
          onSubmit={(payload) =>
            assign.mutateAsync({
              batchId: assignFor.id,
              payload: { faculty_id: Number(payload.faculty_id), subject_id: Number(payload.subject_id) },
            })
          }
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete batch?"
        message="This cannot be undone."
        danger
        confirmLabel="Delete"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await remove.mutateAsync(deleting)
          setDeleting(null)
        }}
      />
      <ConfirmDialog
        open={Boolean(removeAssign)}
        title="Remove assignment?"
        message="Faculty will no longer be linked to this subject in the batch."
        danger
        confirmLabel="Remove"
        onClose={() => setRemoveAssign(null)}
        onConfirm={async () => {
          await unassign.mutateAsync(removeAssign)
          setRemoveAssign(null)
        }}
      />
    </div>
  )
}
