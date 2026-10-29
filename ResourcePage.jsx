import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import api from '@/api/client'
import { useGet } from '@/hooks/useGet'
import { useAction } from '@/hooks/useAction'
import { getErrorMessage } from '@/lib/errors'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import DynamicForm from '@/components/ui/DynamicForm'
import { useOptions } from '@/hooks/useOptions'

function FilterSelect({ filter, value, onChange }) {
  const fetched = useOptions(filter.optionsEndpoint, {
    params: filter.optionsParams,
    enabled: Boolean(filter.optionsEndpoint),
    map: filter.optionMap,
  })
  const options = filter.optionsEndpoint ? fetched.options : filter.options || []
  return (
    <select className="input max-w-xs" value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={filter.label}>
      <option value="">{filter.label}</option>
      {options.map((opt) => (
        <option key={String(opt.value)} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function toFormData(payload, fileFields = []) {
  const fd = new FormData()
  Object.entries(payload).forEach(([key, val]) => {
    if (val == null || val === '') return
    if (fileFields.includes(key)) {
      if (val instanceof File) fd.append(key, val)
      return
    }
    if (Array.isArray(val)) {
      val.forEach((item) => fd.append(key, item))
      return
    }
    if (typeof val === 'boolean') fd.append(key, val ? 'true' : 'false')
    else fd.append(key, val)
  })
  return fd
}

export default function ResourcePage({
  title,
  description,
  endpoint,
  queryKey,
  columns,
  fields,
  searchPlaceholder = 'Search',
  extraFilters = [],
  canCreate = true,
  canEdit = true,
  canDelete = true,
  multipart = false,
  fileField = 'file',
  extraActions,
  transformPayload,
  emptyTitle = 'No records yet',
}) {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [draftQ, setDraftQ] = useState('')
  const [filters, setFilters] = useState({})
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [serverError, setServerError] = useState(null)

  const params = useMemo(
    () => ({
      page,
      per_page: 10,
      q: q || undefined,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null)),
    }),
    [page, q, filters],
  )

  const key = queryKey || [endpoint]
  const list = useGet(key, endpoint, params)
  const rows = Array.isArray(list.data?.data) ? list.data.data : []
  const meta = list.data?.meta

  const save = useAction({
    mutationFn: async ({ id, payload }) => {
      const body = transformPayload ? transformPayload(payload, id) : payload
      const fileFields = multipart ? [fileField] : []
      const hasFile = multipart && body[fileField] instanceof File
      const data = hasFile || (multipart && !id) ? toFormData(body, fileFields) : body
      if (id) return api.patch(`${endpoint}/${id}`, data)
      return api.post(endpoint, data)
    },
    invalidate: key,
    successMessage: 'Saved',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setCreating(false)
      setEditing(null)
      setServerError(null)
    },
  })

  const remove = useAction({
    mutationFn: (row) => api.delete(`${endpoint}/${row.id}`),
    invalidate: key,
    successMessage: 'Deleted',
  })

  const tableColumns = [
    ...columns,
    ...(canEdit || canDelete || extraActions
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (row) => (
              <div className="flex justify-end gap-1">
                {extraActions?.(row)}
                {canEdit ? (
                  <Button variant="ghost" className="px-2" aria-label="Edit" onClick={() => setEditing(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button variant="ghost" className="px-2 text-red-600" aria-label="Delete" onClick={() => setDeleting(row)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ]

  const formOpen = creating || Boolean(editing)

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          canCreate ? (
            <Button onClick={() => { setCreating(true); setServerError(null) }}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          ) : null
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <form
          className="flex min-w-[220px] flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setQ(draftQ)
          }}
        >
          <input
            className="input"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        {extraFilters.map((filter) => (
          <FilterSelect
            key={filter.name}
            filter={filter}
            value={filters[filter.name] || ''}
            onChange={(v) => {
              setFilters((f) => ({ ...f, [filter.name]: v }))
              setPage(1)
            }}
          />
        ))}
      </div>
      <div className="card p-4">
        <DataTable
          columns={tableColumns}
          rows={rows}
          loading={list.isLoading}
          error={list.isError ? getErrorMessage(list.error) : null}
          onRetry={() => list.refetch()}
          emptyTitle={emptyTitle}
          page={meta?.page}
          pages={meta?.pages}
          total={meta?.total}
          onPageChange={setPage}
        />
      </div>
      <Modal
        open={formOpen}
        title={editing ? `Edit ${title}` : `New ${title}`}
        onClose={() => {
          setCreating(false)
          setEditing(null)
          setServerError(null)
        }}
      >
        <DynamicForm
          fields={fields}
          defaultValues={editing || {}}
          serverError={serverError}
          submitting={save.isPending}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSubmit={(payload) => save.mutateAsync({ id: editing?.id, payload })}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete record?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await remove.mutateAsync(deleting)
          setDeleting(null)
        }}
      />
    </div>
  )
}
