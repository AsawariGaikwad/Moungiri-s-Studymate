import ResourcePage from '@/components/ui/ResourcePage'
import Badge from '@/components/ui/Badge'
import { formatMoney } from '@/lib/format'

export default function FeeStructures() {
  return (
    <ResourcePage
      title="Fee Structures"
      endpoint="/fee-structures"
      queryKey={['fee-structures']}
      emptyTitle="No fee structures yet"
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'academic_year', header: 'Year' },
        { key: 'total_amount', header: 'Amount', render: (row) => formatMoney(row.total_amount) },
        { key: 'is_active', header: 'Active', render: (row) => <Badge tone={row.is_active ? 'green' : 'slate'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'batch_id', label: 'Batch', type: 'select', required: true, optionsEndpoint: '/batches', optionMap: { value: 'id', label: 'name' } },
        { name: 'academic_year', label: 'Academic year', type: 'text', required: true },
        { name: 'total_amount', label: 'Total amount', type: 'number', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
