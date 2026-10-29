import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useGet } from '@/hooks/useGet'
import { useOptions } from '@/hooks/useOptions'
import { getErrorMessage } from '@/lib/errors'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'

export default function FileLibrary({
  title,
  description,
  endpoint,
  queryKey,
  extraFilterKeys = [],
  emptyTitle = 'No files yet',
}) {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [filters, setFilters] = useState({})

  const subjects = useOptions('/subjects', { map: { value: 'id', label: 'name' } })
  const exams = useOptions('/exams', { map: { value: 'id', label: 'name' } })

  const params = useMemo(
    () => ({
      page,
      per_page: 10,
      q: q || undefined,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    }),
    [page, q, filters],
  )

  const list = useGet(queryKey || [endpoint], endpoint, params)
  const rows = Array.isArray(list.data?.data) ? list.data.data : []
  const meta = list.data?.meta

  const columns = [
    { key: 'title', header: 'Title' },
    extraFilterKeys.includes('year') ? { key: 'year', header: 'Year' } : null,
    extraFilterKeys.includes('category') ? { key: 'category', header: 'Category' } : null,
    extraFilterKeys.includes('class_level') ? { key: 'class_level', header: 'Class' } : null,
    {
      key: 'file',
      header: 'File',
      render: (row) => (
        <a
          className="inline-flex items-center gap-1 text-brand-700 hover:underline dark:text-brand-300"
          href={`/api/v1${endpoint}/${row.id}/file`}
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      ),
    },
  ].filter(Boolean)

  return (
    <div>
      <PageHeader title={title} description={description} />
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQ(draft)
        }}
      >
        <input className="input min-w-[200px] flex-1" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search" />
        {extraFilterKeys.includes('class_level') ? (
          <input
            className="input max-w-[140px]"
            placeholder="Class"
            value={filters.class_level || ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, class_level: e.target.value }))
              setPage(1)
            }}
          />
        ) : null}
        {extraFilterKeys.includes('year') ? (
          <input
            className="input max-w-[120px]"
            placeholder="Year"
            value={filters.year || ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, year: e.target.value }))
              setPage(1)
            }}
          />
        ) : null}
        <select
          className="input max-w-xs"
          value={filters.subject_id || ''}
          onChange={(e) => {
            setFilters((f) => ({ ...f, subject_id: e.target.value }))
            setPage(1)
          }}
          aria-label="Subject"
        >
          <option value="">Subject</option>
          {subjects.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="input max-w-xs"
          value={filters.exam_id || ''}
          onChange={(e) => {
            setFilters((f) => ({ ...f, exam_id: e.target.value }))
            setPage(1)
          }}
          aria-label="Exam"
        >
          <option value="">Exam</option>
          {exams.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <div className="card p-4">
        <DataTable
          columns={columns}
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
    </div>
  )
}
