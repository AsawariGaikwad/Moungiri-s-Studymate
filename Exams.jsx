import ResourcePage from '@/components/ui/ResourcePage'
import Badge from '@/components/ui/Badge'

export default function Exams() {
  return (
    <ResourcePage
      title="Exams"
      endpoint="/exams"
      queryKey={['exams']}
      emptyTitle="No exams yet"
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'description', header: 'Description' },
        { key: 'is_active', header: 'Active', render: (row) => <Badge tone={row.is_active ? 'green' : 'slate'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
