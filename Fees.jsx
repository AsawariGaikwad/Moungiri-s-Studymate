import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import { formatMoney } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

const tone = { PAID: 'green', PARTIAL: 'amber', PENDING: 'red' }

export default function Fees() {
  const mine = useGet(['fees', 'my'], '/fees/my')
  const rows = Array.isArray(mine.data?.data) ? mine.data.data : []

  if (mine.isLoading) return <CardSkeleton count={2} />
  if (mine.isError) return <ErrorState message={getErrorMessage(mine.error)} onRetry={() => mine.refetch()} />

  return (
    <div>
      <PageHeader title="Fees & receipts" />
      {rows.length === 0 ? <EmptyState title="No fee records yet" /> : null}
      <div className="space-y-4">
        {rows.map((fee) => (
          <article key={fee.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{fee.fee_name}</h2>
                <p className="text-sm text-slate-500">{fee.academic_year}</p>
              </div>
              <Badge tone={tone[fee.status] || 'slate'}>{fee.status}</Badge>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>Total: {formatMoney(fee.total_amount)}</div>
              <div>Discount: {formatMoney(fee.discount)}</div>
              <div>Payable: {formatMoney(fee.payable)}</div>
              <div>Paid: {formatMoney(fee.paid)}</div>
              <div>Pending: {formatMoney(fee.pending)}</div>
              <div>Due: {formatDate(fee.due_date)}</div>
            </dl>
            <h3 className="mt-4 text-sm font-semibold">Payments</h3>
            {!fee.payments?.length ? (
              <p className="mt-1 text-sm text-slate-500">No payments yet</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {fee.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <span>
                      {formatMoney(p.amount)} · {p.mode} · {formatDate(p.payment_date)} · {p.receipt_no || p.reference || '—'}
                    </span>
                    <a className="text-brand-700 hover:underline" href={`/api/v1/fees/receipts/${p.id}`}>
                      Receipt
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
