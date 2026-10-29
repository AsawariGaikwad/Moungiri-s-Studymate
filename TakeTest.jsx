import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { getErrorMessage } from '@/lib/errors'
import { formatTimeLeft } from '@/lib/datetime'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import ErrorState from '@/components/ui/ErrorState'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

export default function TakeTest() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [answers, setAnswers] = useState({})
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    let cancelled = false
    api
      .post(`/tests/${id}/start`)
      .then((res) => {
        if (cancelled) return
        const data = res.data.data
        setSession(data)
        setSeconds(data.remaining_seconds ?? 0)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not start this test.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const submit = async (auto) => {
    if (submitted.current || submitting) return
    submitted.current = true
    setSubmitting(true)
    try {
      await api.post(`/tests/${id}/submit`, { answers, auto: Boolean(auto) })
      toast.success(auto ? 'Time is up. Your answers were submitted.' : 'Test submitted')
      navigate(`/tests/${id}/result`, { replace: true })
    } catch (err) {
      submitted.current = false
      toast.error(getErrorMessage(err, 'Could not submit the test.'))
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!session) return undefined
    const tick = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick)
          submit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(tick)
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onLeave = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [])

  const questions = useMemo(() => session?.questions || session?.test?.questions || [], [session])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={() => navigate('/tests')} />

  return (
    <div>
      <PageHeader
        title={session?.test?.title || 'Mock test'}
        description="Leaving this page may lose unsaved progress. The timer comes from the server."
        actions={
          <div className={cn('rounded-lg px-3 py-2 font-mono text-lg', seconds < 60 ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-900')}>
            {formatTimeLeft(seconds)}
          </div>
        }
      />
      <div className="space-y-4">
        {questions.map((q, index) => (
          <fieldset key={q.id} className="card p-5">
            <legend className="mb-2 font-medium">
              {index + 1}. {q.text} <span className="text-xs text-slate-500">({q.marks} marks)</span>
            </legend>
            {['A', 'B', 'C', 'D'].map((opt) => (
              <label key={opt} className="mt-2 flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                />
                <span>
                  <strong className="mr-1">{opt}.</strong>
                  {q.options?.[opt]}
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => submit(false)} loading={submitting}>
          Submit test
        </Button>
      </div>
    </div>
  )
}
