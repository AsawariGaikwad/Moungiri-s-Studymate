import { useAuth } from '@/context/AuthContext'
import FileLibrary from '@/components/FileLibrary'
import ResourcePage from '@/components/ui/ResourcePage'
import Badge from '@/components/ui/Badge'

const fields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'class_level', label: 'Class level', type: 'text' },
  {
    name: 'subject_id',
    label: 'Subject',
    type: 'select',
    optionsEndpoint: '/subjects',
    optionMap: { value: 'id', label: 'name' },
  },
  {
    name: 'exam_id',
    label: 'Exam',
    type: 'select',
    optionsEndpoint: '/exams',
    optionMap: { value: 'id', label: 'name' },
  },
  { name: 'category', label: 'Category', type: 'text' },
  { name: 'is_published', label: 'Published', type: 'checkbox' },
  { name: 'file', label: 'File', type: 'file', accept: '.pdf,.png,.jpg,.jpeg,.docx,.pptx,.xlsx', help: 'PDF, images or Office files. Max 20 MB.' },
]

export default function StudyMaterial() {
  const { user } = useAuth()
  if (user?.role === 'STUDENT') {
    return (
      <FileLibrary
        title="Study Material"
        description="Notes and files shared with your class."
        endpoint="/materials"
        queryKey={['materials']}
        extraFilterKeys={['class_level', 'category']}
        emptyTitle="No study material yet"
      />
    )
  }
  return (
    <ResourcePage
      title="Study Material"
      endpoint="/materials"
      queryKey={['materials']}
      multipart
      emptyTitle="No study material yet"
      extraFilters={[
        { name: 'class_level', label: 'Class', options: [] },
        { name: 'subject_id', label: 'Subject', optionsEndpoint: '/subjects' },
        { name: 'exam_id', label: 'Exam', optionsEndpoint: '/exams' },
      ]}
      columns={[
        { key: 'title', header: 'Title' },
        { key: 'class_level', header: 'Class' },
        { key: 'category', header: 'Category' },
        {
          key: 'is_published',
          header: 'Published',
          render: (row) => <Badge tone={row.is_published ? 'green' : 'slate'}>{row.is_published ? 'Yes' : 'No'}</Badge>,
        },
        {
          key: 'file',
          header: 'File',
          render: (row) => (
            <a className="text-brand-700 hover:underline dark:text-brand-300" href={`/api/v1/materials/${row.id}/file`}>
              Download
            </a>
          ),
        },
      ]}
      fields={fields}
    />
  )
}
