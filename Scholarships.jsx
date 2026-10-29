import { useAuth } from '@/context/AuthContext'
import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import { formatMoney } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import ResourcePage from '@/components/ui/ResourcePage'
import Badge from '@/components/ui/Badge'

export default function Scholarships() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') {
    return (
      <ResourcePage
        title="Scholarships"
        endpoint="/scholarships"
        queryKey={['scholarships']}
        emptyTitle="No scholarships yet"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'provider', header: 'Provider' },
          { key: 'amount', header: 'Amount', render: (row) => formatMoney(row.amount) },
          { key: 'deadline', header: 'Deadline', render: (row) => formatDate(row.deadline) },
          {
            key: 'is_active',
            header: 'Active',
            render: (row) => <Badge tone={row.is_active ? 'green' : 'slate'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
          },
        ]}
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'provider', label: 'Provider', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'eligibility', label: 'Eligibility', type: 'textarea' },
          { name: 'amount', label: 'Amount', type: 'number' },
          { name: 'deadline', label: 'Deadline', type: 'date' },
          { name: 'link', label: 'Link', type: 'text' },
          { name: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />
    )
  }

  const list = useGet(['scholarships'], '/scholarships', { per_page: 50 })
  const rows = Array.isArray(list.data?.data) ? list.data.data : []

  return (
    <div>
      <PageHeader title="Scholarships" />
      {list.isLoading ? <CardSkeleton count={3} /> : null}
      {list.isError ? <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? <EmptyState title="No scholarships yet" /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((item) => (
          <article key={item.id} className="card p-5">
            <h2 className="font-semibold">{item.name}</h2>
            <p className="text-sm text-slate-500">{item.provider}</p>
            <p className="mt-2 text-sm">{item.description}</p>
            <p className="mt-2 text-sm">Eligibility: {item.eligibility || '—'}</p>
            <p className="mt-2 text-sm">Amount: {formatMoney(item.amount)}</p>
            <p className="text-sm">Deadline: {formatDate(item.deadline)}</p>
            {item.link ? (
              <a className="mt-3 inline-block text-sm text-brand-700 hover:underline" href={item.link} target="_blank" rel="noreferrer">
                Apply / learn more
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
