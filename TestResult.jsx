import { useParams } from 'react-router-dom'
import { useGet } from '@/hooks/useGet'
import { getErrorMessage } from '@/lib/errors'
import { formatNumber, formatPercent } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

export default function TestResult() {
  const { id } = useParams()
  const result = useGet(['tests', id, 'result'], `/tests/${id}/result`)
  const data = result.data?.data

  if (result.isLoading) return <CardSkeleton count={4} />
  if (result.isError) return <ErrorState message={getErrorMessage(result.error)} onRetry={() => result.refetch()} />
  if (!data) return <EmptyState title="No result yet" />

  const review = Array.isArray(data.review) ? data.review : []

  return (
    <div>
      <PageHeader title="Test result" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Score" value={`${formatNumber(data.score)} / ${formatNumber(data.total_marks)}`} />
        <StatCard label="Percentage" value={formatPercent(data.percentage)} />
        <StatCard label="Correct" value={formatNumber(data.correct)} />
        <StatCard label="Wrong" value={formatNumber(data.wrong)} />
        <StatCard label="Unanswered" value={formatNumber(data.unanswered)} />
      </div>
      <h2 className="mb-3 font-semibold">Review</h2>
      {review.length === 0 ? <EmptyState title="No review items yet" /> : null}
      <div className="space-y-3">
        {review.map((item, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {index + 1}. {item.text}
              </p>
              <Badge tone={item.is_correct ? 'green' : 'red'}>{item.is_correct ? 'Correct' : 'Incorrect'}</Badge>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <li key={opt}>
                  {opt}. {item.options?.[opt]}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">Your answer: {item.your_answer || '—'}</p>
            <p className="text-sm">Correct option: {item.correct_option}</p>
            {item.explanation ? <p className="mt-2 text-sm text-slate-500">{item.explanation}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
