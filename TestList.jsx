import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '@/api/client'
import { useGet } from '@/hooks/useGet'
import { useAction } from '@/hooks/useAction'
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
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'subject_id', label: 'Subject', type: 'select', optionsEndpoint: '/subjects', optionMap: { value: 'id', label: 'name' } },
  { name: 'exam_id', label: 'Exam', type: 'select', optionsEndpoint: '/exams', optionMap: { value: 'id', label: 'name' } },
  { name: 'batch_id', label: 'Batch', type: 'select', optionsEndpoint: '/batches', optionMap: { value: 'id', label: 'name' } },
  { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', required: true },
  { name: 'negative_marking', label: 'Negative marking', type: 'checkbox' },
  { name: 'start_at', label: 'Start', type: 'datetime-local', required: true },
  { name: 'end_at', label: 'End', type: 'datetime-local', required: true },
]

export default function TestList() {
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const list = useGet(['tests'], '/tests', { page, per_page: 10 })
  const rows = Array.isArray(list.data?.data) ? list.data.data : []
  const meta = list.data?.meta

  const create = useAction({
    mutationFn: (payload) => api.post('/tests', payload),
    invalidate: ['tests'],
    successMessage: 'Test created',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setOpen(false)
      setServerError(null)
    },
  })
  const remove = useAction({
    mutationFn: (row) => api.delete(`/tests/${row.id}`),
    invalidate: ['tests'],
    successMessage: 'Test deleted',
  })
  const publish = useAction({
    mutationFn: ({ id, published }) => api.post(`/tests/${id}/publish`, { published }),
    invalidate: ['tests'],
    successMessage: 'Updated',
  })

  return (
    <div>
      <PageHeader
        title="Tests"
        actions={
          <Button
            onClick={() => {
              setOpen(true)
              setServerError(null)
            }}
          >
            <Plus className="h-4 w-4" />
            New test
          </Button>
        }
      />
      <div className="card p-4">
        <DataTable
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'start_at', header: 'Start', render: (row) => formatDate(row.start_at, { withTime: true }) },
            { key: 'end_at', header: 'End', render: (row) => formatDate(row.end_at, { withTime: true }) },
            {
              key: 'published',
              header: 'Status',
              render: (row) => <Badge tone={row.published || row.is_published ? 'green' : 'slate'}>{(row.published || row.is_published) ? 'Published' : 'Draft'}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <Button as={Link} to={`/tests/${row.id}/edit`} variant="outline" className="px-2">
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-2"
                    onClick={() => publish.mutate({ id: row.id, published: !(row.published || row.is_published) })}
                  >
                    {(row.published || row.is_published) ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="ghost" className="px-2 text-red-600" onClick={() => setDeleting(row)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={list.isLoading}
          error={list.isError ? getErrorMessage(list.error) : null}
          onRetry={() => list.refetch()}
          emptyTitle="No tests yet"
          page={meta?.page}
          pages={meta?.pages}
          total={meta?.total}
          onPageChange={setPage}
        />
      </div>
      <Modal open={open} title="Create test" onClose={() => setOpen(false)}>
        <DynamicForm
          fields={fields}
          defaultValues={{ negative_marking: false }}
          serverError={serverError}
          submitting={create.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={(payload) => create.mutateAsync(payload)}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete test?"
        message="Tests with attempts cannot be deleted."
        danger
        confirmLabel="Delete"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await remove.mutateAsync(deleting)
          setDeleting(null)
        }}
      />
    </div>
  )
}
