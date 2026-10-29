import ResourcePage from '@/components/ui/ResourcePage'
import Badge from '@/components/ui/Badge'

export default function Subjects() {
  return (
    <ResourcePage
      title="Subjects"
      endpoint="/subjects"
      queryKey={['subjects']}
      emptyTitle="No subjects yet"
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'code', header: 'Code' },
        { key: 'is_active', header: 'Active', render: (row) => <Badge tone={row.is_active ? 'green' : 'slate'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
