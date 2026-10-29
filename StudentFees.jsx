import { useMemo, useState } from 'react'
import api from '@/api/client'
import { useGet } from '@/hooks/useGet'
import { useAction } from '@/hooks/useAction'
import { useOptions } from '@/hooks/useOptions'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import { formatMoney } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import DynamicForm from '@/components/ui/DynamicForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Badge from '@/components/ui/Badge'

const tone = { PAID: 'green', PARTIAL: 'amber', PENDING: 'red' }

export default function StudentFees() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('')
  const [batchId, setBatchId] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [payFor, setPayFor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [serverError, setServerError] = useState(null)
  const batches = useOptions('/batches')
  const structures = useOptions('/fee-structures')
  const students = useOptions('/students', { params: { per_page: 100 } })

  const params = useMemo(
    () => ({
      page,
      per_page: 10,
      q: q || undefined,
      status: status || undefined,
      batch_id: batchId || undefined,
    }),
    [page, q, status, batchId],
  )
  const list = useGet(['student-fees'], '/fees/student-fees', params)
  const rows = Array.isArray(list.data?.data) ? list.data.data : []
  const meta = list.data?.meta

  const assign = useAction({
    mutationFn: (payload) => api.post('/fees/assign', payload),
    invalidate: ['student-fees'],
    successMessage: 'Fee assigned',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setAssignOpen(false)
      setServerError(null)
    },
  })
  const assignBatch = useAction({
    mutationFn: (payload) => api.post('/fees/assign-batch', payload),
    invalidate: ['student-fees'],
    successMessage: 'Assigned to batch',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setBatchOpen(false)
      setServerError(null)
    },
  })
  const pay = useAction({
    mutationFn: (payload) => api.post('/fees/payments', payload),
    invalidate: ['student-fees'],
    successMessage: 'Payment recorded',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setPayFor(null)
      setServerError(null)
    },
  })
  const remove = useAction({
    mutationFn: (row) => api.delete(`/fees/student-fees/${row.id}`),
    invalidate: ['student-fees'],
    successMessage: 'Removed',
  })

  return (
    <div>
      <PageHeader
        title="Student Fees & Payments"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setBatchOpen(true); setServerError(null) }}>Assign to batch</Button>
            <Button onClick={() => { setAssignOpen(true); setServerError(null) }}>Assign to student</Button>
          </div>
        }
      />
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQ(draft)
        }}
      >
        <input className="input min-w-[180px] flex-1" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search" />
        <select className="input max-w-[160px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Status">
          <option value="">All statuses</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PENDING">Pending</option>
        </select>
        <select className="input max-w-xs" value={batchId} onChange={(e) => { setBatchId(e.target.value); setPage(1) }} aria-label="Batch">
          <option value="">All batches</option>
          {batches.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="card p-4">
        <DataTable
          columns={[
            { key: 'full_name', header: 'Student', render: (row) => row.full_name || row.student_name || '—' },
            { key: 'fee_name', header: 'Fee' },
            { key: 'payable', header: 'Payable', render: (row) => formatMoney(row.payable) },
            { key: 'paid', header: 'Paid', render: (row) => formatMoney(row.paid) },
            { key: 'pending', header: 'Pending', render: (row) => formatMoney(row.pending) },
            { key: 'status', header: 'Status', render: (row) => <Badge tone={tone[row.status] || 'slate'}>{row.status}</Badge> },
            { key: 'due_date', header: 'Due', render: (row) => formatDate(row.due_date) },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <Button variant="outline" className="px-2" onClick={() => { setPayFor(row); setServerError(null) }}>Pay</Button>
                  {row.payments?.[0]?.id ? (
                    <a className="inline-flex items-center rounded-lg px-2 text-sm text-brand-700" href={`/api/v1/fees/receipts/${row.payments[0].id}`}>
                      Receipt
                    </a>
                  ) : null}
                  <Button variant="ghost" className="px-2 text-red-600" onClick={() => setDeleting(row)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={list.isLoading}
          error={list.isError ? getErrorMessage(list.error) : null}
          onRetry={() => list.refetch()}
          emptyTitle="No student fees yet"
          page={meta?.page}
          pages={meta?.pages}
          total={meta?.total}
          onPageChange={setPage}
        />
      </div>
      <Modal open={assignOpen} title="Assign fee to student" onClose={() => setAssignOpen(false)}>
        <DynamicForm
          fields={[
            { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.options.map((o) => ({ value: o.value, label: o.label })) },
            { name: 'fee_structure_id', label: 'Fee structure', type: 'select', required: true, options: structures.options },
            { name: 'discount', label: 'Discount', type: 'number' },
            { name: 'due_date', label: 'Due date', type: 'date', required: true },
          ]}
          defaultValues={{ discount: 0 }}
          serverError={serverError}
          submitting={assign.isPending}
          onCancel={() => setAssignOpen(false)}
          onSubmit={(payload) =>
            assign.mutateAsync({
              student_id: Number(payload.student_id),
              fee_structure_id: Number(payload.fee_structure_id),
              discount: payload.discount || 0,
              due_date: payload.due_date,
            })
          }
        />
      </Modal>
      <Modal open={batchOpen} title="Assign fee to batch" onClose={() => setBatchOpen(false)}>
        <DynamicForm
          fields={[
            { name: 'fee_structure_id', label: 'Fee structure', type: 'select', required: true, options: structures.options },
            { name: 'due_date', label: 'Due date', type: 'date', required: true },
          ]}
          defaultValues={{}}
          serverError={serverError}
          submitting={assignBatch.isPending}
          onCancel={() => setBatchOpen(false)}
          onSubmit={(payload) =>
            assignBatch.mutateAsync({
              fee_structure_id: Number(payload.fee_structure_id),
              due_date: payload.due_date,
            })
          }
        />
      </Modal>
      <Modal open={Boolean(payFor)} title="Record payment" onClose={() => setPayFor(null)}>
        <DynamicForm
          fields={[
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'payment_date', label: 'Payment date', type: 'date', required: true },
            {
              name: 'mode',
              label: 'Mode',
              type: 'select',
              required: true,
              options: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'].map((v) => ({ value: v, label: v.replace('_', ' ') })),
            },
            { name: 'reference', label: 'Reference', type: 'text' },
          ]}
          defaultValues={{}}
          serverError={serverError}
          submitting={pay.isPending}
          onCancel={() => setPayFor(null)}
          onSubmit={(payload) =>
            pay.mutateAsync({
              student_fee_id: payFor.id,
              amount: payload.amount,
              payment_date: payload.payment_date,
              mode: payload.mode,
              reference: payload.reference || null,
            })
          }
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove student fee?"
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
