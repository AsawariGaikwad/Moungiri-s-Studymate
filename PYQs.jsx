import { useAuth } from '@/context/AuthContext'
import FileLibrary from '@/components/FileLibrary'
import ResourcePage from '@/components/ui/ResourcePage'
import Badge from '@/components/ui/Badge'

const fields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  {
    name: 'exam_id',
    label: 'Exam',
    type: 'select',
    required: true,
    optionsEndpoint: '/exams',
    optionMap: { value: 'id', label: 'name' },
  },
  {
    name: 'subject_id',
    label: 'Subject',
    type: 'select',
    optionsEndpoint: '/subjects',
    optionMap: { value: 'id', label: 'name' },
  },
  { name: 'year', label: 'Year', type: 'number', required: true },
  { name: 'is_published', label: 'Published', type: 'checkbox' },
  { name: 'file', label: 'File', type: 'file', accept: '.pdf,.png,.jpg,.jpeg,.docx,.pptx,.xlsx' },
]

export default function PYQs() {
  const { user } = useAuth()
  if (user?.role === 'STUDENT') {
    return (
      <FileLibrary
        title="Previous Year Questions"
        description="Past papers for your exams."
        endpoint="/pyqs"
        queryKey={['pyqs']}
        extraFilterKeys={['year']}
        emptyTitle="No PYQs yet"
      />
    )
  }
  return (
    <ResourcePage
      title="PYQs"
      endpoint="/pyqs"
      queryKey={['pyqs']}
      multipart
      emptyTitle="No PYQs yet"
      extraFilters={[
        { name: 'year', label: 'Year', options: [] },
        { name: 'subject_id', label: 'Subject', optionsEndpoint: '/subjects' },
        { name: 'exam_id', label: 'Exam', optionsEndpoint: '/exams' },
      ]}
      columns={[
        { key: 'title', header: 'Title' },
        { key: 'year', header: 'Year' },
        {
          key: 'is_published',
          header: 'Published',
          render: (row) => <Badge tone={row.is_published ? 'green' : 'slate'}>{row.is_published ? 'Yes' : 'No'}</Badge>,
        },
        {
          key: 'file',
          header: 'File',
          render: (row) => (
            <a className="text-brand-700 hover:underline dark:text-brand-300" href={`/api/v1/pyqs/${row.id}/file`}>
              Download
            </a>
          ),
        },
      ]}
      fields={fields}
    />
  )
}
