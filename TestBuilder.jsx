import { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/api/client'
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
import ErrorState from '@/components/ui/ErrorState'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

const testFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'subject_id', label: 'Subject', type: 'select', optionsEndpoint: '/subjects', optionMap: { value: 'id', label: 'name' } },
  { name: 'exam_id', label: 'Exam', type: 'select', optionsEndpoint: '/exams', optionMap: { value: 'id', label: 'name' } },
  { name: 'batch_id', label: 'Batch', type: 'select', optionsEndpoint: '/batches', optionMap: { value: 'id', label: 'name' } },
  { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', required: true },
  { name: 'negative_marking', label: 'Negative marking', type: 'checkbox' },
  { name: 'start_at', label: 'Start', type: 'datetime-local', required: true },
  { name: 'end_at', label: 'End', type: 'datetime-local', required: true },
]

const questionFields = [
  { name: 'text', label: 'Question', type: 'textarea', required: true },
  { name: 'option_a', label: 'Option A', type: 'text', required: true },
  { name: 'option_b', label: 'Option B', type: 'text', required: true },
  { name: 'option_c', label: 'Option C', type: 'text', required: true },
  { name: 'option_d', label: 'Option D', type: 'text', required: true },
  {
    name: 'correct_option',
    label: 'Correct option',
    type: 'select',
    required: true,
    options: ['A', 'B', 'C', 'D'].map((v) => ({ value: v, label: v })),
  },
  { name: 'marks', label: 'Marks', type: 'number', required: true },
  { name: 'explanation', label: 'Explanation', type: 'textarea' },
]

export default function TestBuilder() {
  const { id } = useParams()
  const test = useGet(['tests', id], `/tests/${id}`)
  const attempts = useGet(['tests', id, 'attempts'], `/tests/${id}/attempts`)
  const [serverError, setServerError] = useState(null)
  const [qOpen, setQOpen] = useState(false)
  const [editingQ, setEditingQ] = useState(null)
  const [deletingQ, setDeletingQ] = useState(null)
  const data = test.data?.data
  const questions = data?.questions || []

  const saveTest = useAction({
    mutationFn: (payload) => api.patch(`/tests/${id}`, payload),
    invalidate: ['tests', id],
    successMessage: 'Test updated',
    silentError: true,
    onError: (err) => setServerError(err),
  })
  const saveQuestion = useAction({
    mutationFn: ({ qid, payload }) =>
      qid ? api.patch(`/questions/${qid}`, payload) : api.post(`/tests/${id}/questions`, payload),
    invalidate: ['tests', id],
    successMessage: 'Question saved',
    silentError: true,
    onError: (err) => setServerError(err),
    onSuccess: () => {
      setQOpen(false)
      setEditingQ(null)
      setServerError(null)
    },
  })
  const removeQuestion = useAction({
    mutationFn: (row) => api.delete(`/questions/${row.id}`),
    invalidate: ['tests', id],
    successMessage: 'Question deleted',
  })
  const publish = useAction({
    mutationFn: (published) => api.post(`/tests/${id}/publish`, { published }),
    invalidate: ['tests', id],
    successMessage: 'Updated',
  })

  if (test.isLoading) return <Skeleton className="h-40 w-full" />
  if (test.isError) return <ErrorState message={getErrorMessage(test.error)} onRetry={() => test.refetch()} />
  if (!data) return null

  return (
    <div>
      <PageHeader
        title={data.title}
        actions={
          <Button onClick={() => publish.mutate(!(data.published || data.is_published))}>
            {(data.published || data.is_published) ? 'Unpublish' : 'Publish'}
          </Button>
        }
      />
      <div className="card mb-6 p-5">
        <DynamicForm
          fields={testFields}
          defaultValues={data}
          serverError={serverError}
          submitting={saveTest.isPending}
          onSubmit={(payload) => saveTest.mutateAsync(payload)}
          submitLabel="Save test details"
        />
      </div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Questions</h2>
        <Button
          onClick={() => {
            setEditingQ(null)
            setQOpen(true)
            setServerError(null)
          }}
        >
          Add question
        </Button>
      </div>
      <div className="card mb-6 p-4">
        <DataTable
          columns={[
            { key: 'text', header: 'Question' },
            { key: 'correct_option', header: 'Answer' },
            { key: 'marks', header: 'Marks' },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    className="px-2"
                    onClick={() => {
                      setEditingQ(row)
                      setQOpen(true)
                      setServerError(null)
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" className="px-2 text-red-600" onClick={() => setDeletingQ(row)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          rows={questions}
          emptyTitle="No questions yet"
        />
      </div>
      <h2 className="mb-3 font-semibold">Attempts</h2>
      <div className="card p-4">
        <DataTable
          columns={[
            { key: 'full_name', header: 'Student', render: (row) => row.full_name || row.student_name || '—' },
            { key: 'score', header: 'Score' },
            { key: 'total_marks', header: 'Total' },
            { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
            { key: 'submitted_at', header: 'Submitted', render: (row) => formatDate(row.submitted_at, { withTime: true }) },
          ]}
          rows={Array.isArray(attempts.data?.data) ? attempts.data.data : []}
          loading={attempts.isLoading}
          error={attempts.isError ? getErrorMessage(attempts.error) : null}
          onRetry={() => attempts.refetch()}
          emptyTitle="No attempts yet"
        />
      </div>
      <Modal
        open={qOpen}
        title={editingQ ? 'Edit question' : 'Add question'}
        onClose={() => {
          setQOpen(false)
          setEditingQ(null)
        }}
      >
        <DynamicForm
          fields={questionFields}
          defaultValues={
            editingQ
              ? {
                  ...editingQ,
                  option_a: editingQ.option_a || editingQ.options?.A,
                  option_b: editingQ.option_b || editingQ.options?.B,
                  option_c: editingQ.option_c || editingQ.options?.C,
                  option_d: editingQ.option_d || editingQ.options?.D,
                }
              : {}
          }
          serverError={serverError}
          submitting={saveQuestion.isPending}
          onCancel={() => setQOpen(false)}
          onSubmit={(payload) => saveQuestion.mutateAsync({ qid: editingQ?.id, payload })}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deletingQ)}
        title="Delete question?"
        message="This cannot be undone. Tests with attempts may be locked."
        danger
        confirmLabel="Delete"
        onClose={() => setDeletingQ(null)}
        onConfirm={async () => {
          await removeQuestion.mutateAsync(deletingQ)
          setDeletingQ(null)
        }}
      />
    </div>
  )
}
