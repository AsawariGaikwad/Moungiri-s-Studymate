import { useMemo, useState } from 'react'
import { CheckCheck, Plus, Trash2 } from 'lucide-react'
import api from '@/api/client'
import { useAuth } from '@/context/AuthContext'
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

export default function Notifications() {
  const { user } = useAuth()
  const canCompose = user?.role === 'ADMIN' || user?.role === 'FACULTY'
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const list = useGet(['notifications'], '/notifications', { page, per_page: 10 })
  const assignments = useGet(['my-assignments'], '/my-assignments', undefined, {
    enabled: user?.role === 'FACULTY',
  })
  const rows = Array.isArray(list.data?.data) ? list.data.data : []
  const meta = list.data?.meta
  const batches = Array.isArray(assignments.data?.data) ? assignments.data.data : []
  const uniqueBatches = useMemo(() => {
    const map = new Map()
    batches.forEach((item) => {
      if (item.batch_id != null) map.set(item.batch_id, item.batch_name)
    })
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  }, [batches])

  const fields = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true, wide: true },
    user?.role === 'ADMIN'
      ? {
          name: 'audience_role',
          label: 'Audience role',
          type: 'select',
          options: [
            { value: 'STUDENT', label: 'Student' },
            { value: 'FACULTY', label: 'Faculty' },
            { value: 'ADMIN', label: 'Admin' },
          ],
        }
      : null,
    {
      name: 'batch_id',
      label: 'Batch',
      type: 'select',
      required: user?.role === 'FACULTY',
      options: uniqueBatches,
      optionsEndpoint: user?.role === 'ADMIN' ? '/batches' : undefined,
      optionMap: { value: 'id', label: 'name' },
    },
    { name: 'expires_at', label: 'Expires', type: 'datetime-local' },
  ].filter(Boolean)

  const readOne = useAction({
    mutationFn: (row) => api.post(`/notifications/${row.id}/read`),
    invalidate: [['notifications'], ['notifications', 'unread-count']],
  })
  const readAll = useAction({
    mutationFn: () => api.post('/notifications/read-all'),
    invalidate: [['notifications'], ['notifications', 'unread-count']],
    successMessage: 'All marked as read',
  })
  const create = useAction({
    mutationFn: (payload) => api.post('/notifications', payload),
    invalidate: ['notifications'],
    successMessage: 'Notification posted',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setOpen(false)
      setServerError(null)
    },
  })
  const remove = useAction({
    mutationFn: (row) => api.delete(`/notifications/${row.id}`),
    invalidate: [['notifications'], ['notifications', 'unread-count']],
    successMessage: 'Deleted',
  })

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => readAll.mutate()} loading={readAll.isPending}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
            {canCompose ? (
              <Button
                onClick={() => {
                  setOpen(true)
                  setServerError(null)
                }}
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="card p-4">
        <DataTable
          columns={[
            {
              key: 'title',
              header: 'Title',
              render: (row) => (
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-slate-500">{row.message}</p>
                </div>
              ),
            },
            {
              key: 'is_read',
              header: 'Status',
              render: (row) => <Badge tone={row.is_read ? 'slate' : 'amber'}>{row.is_read ? 'Read' : 'Unread'}</Badge>,
            },
            { key: 'created_at', header: 'When', render: (row) => formatDate(row.created_at, { withTime: true }) },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  {!row.is_read ? (
                    <Button variant="ghost" className="px-2" onClick={() => readOne.mutate(row)}>
                      Mark read
                    </Button>
                  ) : null}
                  {row.can_delete ? (
                    <Button variant="ghost" className="px-2 text-red-600" onClick={() => setDeleting(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={list.isLoading}
          error={list.isError ? getErrorMessage(list.error) : null}
          onRetry={() => list.refetch()}
          emptyTitle="No notifications yet"
          page={meta?.page}
          pages={meta?.pages}
          total={meta?.total}
          onPageChange={setPage}
        />
      </div>
      <Modal open={open} title="Post notification" onClose={() => setOpen(false)}>
        <DynamicForm
          fields={fields}
          defaultValues={{}}
          serverError={serverError}
          submitting={create.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={(payload) => create.mutateAsync(payload)}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete notification?"
        message="This cannot be undone."
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
