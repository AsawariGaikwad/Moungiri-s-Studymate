import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/api/client'
import { useGet } from '@/hooks/useGet'
import { useAction } from '@/hooks/useAction'
import { useOptions } from '@/hooks/useOptions'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/datetime'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CopyDialog from '@/components/ui/CopyDialog'
import Badge from '@/components/ui/Badge'

const schema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  email: z.string().email('Enter a valid email'),
  full_name: z.string().trim().min(1, 'Name is required'),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  password: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  dob: z.string().optional().or(z.literal('')),
  class_level: z.string().optional().or(z.literal('')),
  stream: z.string().optional().or(z.literal('')),
  batch_id: z.string().optional().or(z.literal('')),
  roll_no: z.string().optional().or(z.literal('')),
  parent_name: z.string().optional().or(z.literal('')),
  parent_phone: z.string().optional().or(z.literal('')),
  admission_date: z.string().optional().or(z.literal('')),
  exam_ids: z.array(z.string()).optional(),
  employee_code: z.string().optional().or(z.literal('')),
  qualification: z.string().optional().or(z.literal('')),
  specialization: z.string().optional().or(z.literal('')),
  joining_date: z.string().optional().or(z.literal('')),
})

function toPayload(values) {
  const payload = {
    username: values.username,
    email: values.email,
    full_name: values.full_name,
    role: values.role,
    phone: values.phone || null,
    address: values.address || null,
    dob: values.dob || null,
  }
  if (values.password) payload.password = values.password
  if (values.role === 'STUDENT') {
    payload.student = {
      class_level: values.class_level || null,
      stream: values.stream || null,
      batch_id: values.batch_id ? Number(values.batch_id) : null,
      roll_no: values.roll_no || null,
      parent_name: values.parent_name || null,
      parent_phone: values.parent_phone || null,
      admission_date: values.admission_date || null,
      exam_ids: (values.exam_ids || []).map((id) => Number(id)),
    }
  }
  if (values.role === 'FACULTY') {
    payload.faculty = {
      employee_code: values.employee_code || null,
      qualification: values.qualification || null,
      specialization: values.specialization || null,
      joining_date: values.joining_date || null,
    }
  }
  return payload
}

function fromUser(user) {
  return {
    username: user.username || '',
    email: user.email || '',
    full_name: user.full_name || '',
    role: user.role || 'STUDENT',
    password: '',
    phone: user.phone || '',
    address: user.address || '',
    dob: user.dob || '',
    class_level: user.student?.class_level || '',
    stream: user.student?.stream || '',
    batch_id: user.student?.batch_id ? String(user.student.batch_id) : '',
    roll_no: user.student?.roll_no || '',
    parent_name: user.student?.parent_name || '',
    parent_phone: user.student?.parent_phone || '',
    admission_date: user.student?.admission_date || '',
    exam_ids: (user.student?.exam_ids || []).map(String),
    employee_code: user.faculty?.employee_code || '',
    qualification: user.faculty?.qualification || '',
    specialization: user.faculty?.specialization || '',
    joining_date: user.faculty?.joining_date || '',
  }
}

function UserForm({ defaultValues, onSubmit, onCancel, submitting }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })
  const role = form.watch('role')
  const batches = useOptions('/batches')
  const exams = useOptions('/exams')

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(toPayload(values))
    } catch (err) {
      applyServerErrors(form.setError, err)
    }
  })

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input id="username" className="input" disabled={Boolean(defaultValues.id)} {...form.register('username')} />
        {form.formState.errors.username ? <p className="error-text">{form.formState.errors.username.message}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="role">Role</label>
        <select id="role" className="input" {...form.register('role')}>
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="full_name">Full name</label>
        <input id="full_name" className="input" {...form.register('full_name')} />
        {form.formState.errors.full_name ? <p className="error-text">{form.formState.errors.full_name.message}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" {...form.register('email')} />
        {form.formState.errors.email ? <p className="error-text">{form.formState.errors.email.message}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="password">Password (leave blank to auto-generate)</label>
        <input id="password" type="password" className="input" {...form.register('password')} />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input id="phone" className="input" {...form.register('phone')} />
      </div>
      <div>
        <label className="label" htmlFor="dob">Date of birth</label>
        <input id="dob" type="date" className="input" {...form.register('dob')} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="address">Address</label>
        <textarea id="address" className="input min-h-[72px]" {...form.register('address')} />
      </div>
      {role === 'STUDENT' ? (
        <>
          <div>
            <label className="label" htmlFor="class_level">Class level</label>
            <input id="class_level" className="input" {...form.register('class_level')} />
          </div>
          <div>
            <label className="label" htmlFor="stream">Stream</label>
            <input id="stream" className="input" {...form.register('stream')} />
          </div>
          <div>
            <label className="label" htmlFor="batch_id">Batch</label>
            <select id="batch_id" className="input" {...form.register('batch_id')}>
              <option value="">Select batch</option>
              {batches.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="roll_no">Roll no</label>
            <input id="roll_no" className="input" {...form.register('roll_no')} />
          </div>
          <div>
            <label className="label" htmlFor="parent_name">Parent name</label>
            <input id="parent_name" className="input" {...form.register('parent_name')} />
          </div>
          <div>
            <label className="label" htmlFor="parent_phone">Parent phone</label>
            <input id="parent_phone" className="input" {...form.register('parent_phone')} />
          </div>
          <div>
            <label className="label" htmlFor="admission_date">Admission date</label>
            <input id="admission_date" type="date" className="input" {...form.register('admission_date')} />
          </div>
          <div className="sm:col-span-2">
            <p className="label">Exams</p>
            <div className="grid gap-1 sm:grid-cols-2">
              {exams.options.map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={String(o.value)} {...form.register('exam_ids')} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {role === 'FACULTY' ? (
        <>
          <div>
            <label className="label" htmlFor="employee_code">Employee code</label>
            <input id="employee_code" className="input" {...form.register('employee_code')} />
          </div>
          <div>
            <label className="label" htmlFor="qualification">Qualification</label>
            <input id="qualification" className="input" {...form.register('qualification')} />
          </div>
          <div>
            <label className="label" htmlFor="specialization">Specialization</label>
            <input id="specialization" className="input" {...form.register('specialization')} />
          </div>
          <div>
            <label className="label" htmlFor="joining_date">Joining date</label>
            <input id="joining_date" type="date" className="input" {...form.register('joining_date')} />
          </div>
        </>
      ) : null}
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>Save</Button>
      </div>
    </form>
  )
}

export default function Users() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('')
  const [batchId, setBatchId] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [temp, setTemp] = useState(null)
  const batches = useOptions('/batches')

  const params = useMemo(
    () => ({
      page,
      per_page: 10,
      q: q || undefined,
      role: role || undefined,
      is_active: isActive === '' ? undefined : isActive,
      batch_id: batchId || undefined,
    }),
    [page, q, role, isActive, batchId],
  )
  const list = useGet(['users'], '/users', params)
  const rows = Array.isArray(list.data?.data) ? list.data.data : []
  const meta = list.data?.meta

  const save = useAction({
    mutationFn: async ({ id, payload }) => {
      const res = id ? await api.patch(`/users/${id}`, payload) : await api.post('/users', payload)
      return res.data
    },
    invalidate: ['users'],
    successMessage: 'User saved',
    silentError: true,
    onSuccess: (data) => {
      setCreating(false)
      setEditing(null)
      if (data?.temporary_password) setTemp(data.temporary_password)
    },
  })
  const act = useAction({
    mutationFn: async ({ type, row }) => {
      if (type === 'delete') return api.delete(`/users/${row.id}`)
      if (type === 'activate') return api.post(`/users/${row.id}/activate`)
      if (type === 'deactivate') return api.post(`/users/${row.id}/deactivate`)
      const res = await api.post(`/users/${row.id}/reset-password`)
      return res.data
    },
    invalidate: ['users'],
    successMessage: (data, vars) => (vars.type === 'reset' ? 'Password reset' : 'Updated'),
    onSuccess: (data, vars) => {
      if (vars.type === 'reset' && data?.temporary_password) setTemp(data.temporary_password)
    },
  })

  return (
    <div>
      <PageHeader
        title="Users"
        actions={<Button onClick={() => setCreating(true)}>New user</Button>}
      />
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQ(draft)
        }}
      >
        <input className="input min-w-[180px] flex-1" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search" />
        <select className="input max-w-[140px]" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} aria-label="Role">
          <option value="">All roles</option>
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className="input max-w-[140px]" value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1) }} aria-label="Status">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select className="input max-w-xs" value={batchId} onChange={(e) => { setBatchId(e.target.value); setPage(1) }} aria-label="Batch">
          <option value="">All batches</option>
          {batches.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="card p-4">
        <DataTable
          columns={[
            { key: 'full_name', header: 'Name' },
            { key: 'username', header: 'Username' },
            { key: 'role', header: 'Role', render: (row) => <Badge>{row.role}</Badge> },
            { key: 'is_active', header: 'Status', render: (row) => <Badge tone={row.is_active ? 'green' : 'red'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'last_login', header: 'Last login', render: (row) => formatDate(row.last_login, { withTime: true }) },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-1">
                  <Button variant="outline" className="px-2" onClick={() => setEditing(row)}>Edit</Button>
                  <Button variant="secondary" className="px-2" onClick={() => setConfirm({ type: row.is_active ? 'deactivate' : 'activate', row })}>
                    {row.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="secondary" className="px-2" onClick={() => setConfirm({ type: 'reset', row })}>Reset password</Button>
                  <Button variant="ghost" className="px-2 text-red-600" onClick={() => setConfirm({ type: 'delete', row })}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={rows}
          loading={list.isLoading}
          error={list.isError ? getErrorMessage(list.error) : null}
          onRetry={() => list.refetch()}
          emptyTitle="No users yet"
          page={meta?.page}
          pages={meta?.pages}
          total={meta?.total}
          onPageChange={setPage}
        />
      </div>
      <Modal open={creating || Boolean(editing)} title={editing ? 'Edit user' : 'New user'} onClose={() => { setCreating(false); setEditing(null) }} size="xl">
        <UserForm
          defaultValues={editing ? { ...fromUser(editing), id: editing.id } : fromUser({ role: 'STUDENT' })}
          submitting={save.isPending}
          onCancel={() => { setCreating(false); setEditing(null) }}
          onSubmit={(payload) => save.mutateAsync({ id: editing?.id, payload })}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirm action"
        message="This will update the selected user."
        danger={confirm?.type === 'delete' || confirm?.type === 'deactivate'}
        loading={act.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await act.mutateAsync(confirm)
          setConfirm(null)
        }}
      />
      <CopyDialog
        open={Boolean(temp)}
        title="Temporary password"
        label="Share this password with the user. It will not be shown again."
        value={temp}
        onClose={() => setTemp(null)}
      />
    </div>
  )
}
