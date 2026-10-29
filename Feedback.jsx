import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { useGet } from '@/hooks/useGet'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  rating: z.coerce.number().min(1).max(5),
  message: z.string().trim().min(1, 'Message is required'),
})

export default function Feedback() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [page, setPage] = useState(1)
  const list = useGet(['feedback'], '/feedback', { page, per_page: 10 }, { enabled: isAdmin })
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: '', rating: 5, message: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api.post('/feedback', values)
      toast.success('Thank you for your feedback')
      form.reset({ category: '', rating: 5, message: '' })
    } catch (err) {
      if (!applyServerErrors(form.setError, err)) toast.error(getErrorMessage(err))
    }
  })

  if (isAdmin) {
    const rows = Array.isArray(list.data?.data) ? list.data.data : []
    const meta = list.data?.meta
    return (
      <div>
        <PageHeader title="Feedback" description="Messages submitted by students and faculty." />
        <div className="card p-4">
          <DataTable
            columns={[
              { key: 'category', header: 'Category' },
              { key: 'rating', header: 'Rating' },
              { key: 'message', header: 'Message' },
              { key: 'created_at', header: 'When', render: (row) => formatDate(row.created_at || row.submitted_at, { withTime: true }) },
            ]}
            rows={rows}
            loading={list.isLoading}
            error={list.isError ? getErrorMessage(list.error) : null}
            onRetry={() => list.refetch()}
            emptyTitle="No feedback yet"
            page={meta?.page}
            pages={meta?.pages}
            total={meta?.total}
            onPageChange={setPage}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Feedback" description="Tell us how we can improve StudyMate." />
      <form onSubmit={onSubmit} className="card mx-auto max-w-xl space-y-4 p-5" noValidate>
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <input id="category" className="input" {...form.register('category')} />
          {form.formState.errors.category ? <p className="error-text">{form.formState.errors.category.message}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="rating">
            Rating (1–5)
          </label>
          <input id="rating" type="number" min="1" max="5" className="input" {...form.register('rating')} />
        </div>
        <div>
          <label className="label" htmlFor="message">
            Message
          </label>
          <textarea id="message" className="input min-h-[120px]" {...form.register('message')} />
          {form.formState.errors.message ? <p className="error-text">{form.formState.errors.message.message}</p> : null}
        </div>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Send feedback
        </Button>
      </form>
    </div>
  )
}
