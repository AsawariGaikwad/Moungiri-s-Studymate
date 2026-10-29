import { useAuth } from '@/context/AuthContext'
import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import ResourcePage from '@/components/ui/ResourcePage'
import Badge from '@/components/ui/Badge'

export default function CareerGuidance() {
  const { user } = useAuth()
  if (user?.role !== 'STUDENT') {
    return (
      <ResourcePage
        title="Career Content"
        endpoint="/career-guides"
        queryKey={['career-guides']}
        emptyTitle="No career guides yet"
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'category', header: 'Category' },
          {
            key: 'is_published',
            header: 'Published',
            render: (row) => <Badge tone={row.is_published ? 'green' : 'slate'}>{row.is_published ? 'Yes' : 'No'}</Badge>,
          },
        ]}
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'category', label: 'Category', type: 'text' },
          { name: 'content', label: 'Content', type: 'textarea', required: true },
          {
            name: 'exam_id',
            label: 'Exam',
            type: 'select',
            optionsEndpoint: '/exams',
            optionMap: { value: 'id', label: 'name' },
          },
          { name: 'link', label: 'Link', type: 'text' },
          { name: 'is_published', label: 'Published', type: 'checkbox' },
        ]}
      />
    )
  }

  const list = useGet(['career-guides'], '/career-guides', { per_page: 50 })
  const rows = Array.isArray(list.data?.data) ? list.data.data : []

  return (
    <div>
      <PageHeader title="Career Guidance" description="Guides published for your exams." />
      {list.isLoading ? <CardSkeleton count={3} /> : null}
      {list.isError ? <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? <EmptyState title="No career guides yet" /> : null}
      <div className="space-y-4">
        {rows.map((item) => (
          <article key={item.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{item.title}</h2>
              {item.category ? <Badge>{item.category}</Badge> : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{item.content}</p>
            {item.link ? (
              <a className="mt-3 inline-block text-sm text-brand-700 hover:underline" href={item.link} target="_blank" rel="noreferrer">
                Open resource
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
