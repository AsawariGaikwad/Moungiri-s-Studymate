import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useOptions } from '@/hooks/useOptions'
import { applyServerErrors } from '@/lib/errors'
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/datetime'
import Button from '@/components/ui/Button'

function fieldSchema(field) {
  const label = field.label || field.name
  if (field.type === 'number') {
    let s = z.preprocess(
      (v) => (v === '' || v == null ? undefined : v),
      z.coerce.number({ invalid_type_error: `${label} must be a number` }),
    )
    if (!field.required) s = s.optional().nullable()
    return s
  }
  if (field.type === 'checkbox') return z.boolean().optional()
  if (field.type === 'multiselect') {
    const s = z.array(z.union([z.string(), z.number()]))
    return field.required ? s.min(1, `${label} is required`) : s.optional()
  }
  if (field.type === 'file') {
    if (field.required) {
      return z.any().refine((v) => v instanceof File, { message: `${label} is required` })
    }
    return z.any().optional().nullable()
  }
  let s = z.string()
  if (field.required) s = s.trim().min(1, `${label} is required`)
  else s = s.optional().or(z.literal(''))
  return s
}

export function schemaFromFields(fields) {
  const shape = {}
  fields.forEach((field) => {
    shape[field.name] = fieldSchema(field)
  })
  return z.object(shape)
}

function hydrate(fields, values = {}) {
  const next = {}
  fields.forEach((field) => {
    const raw = values[field.name]
    if (field.type === 'checkbox') next[field.name] = Boolean(raw)
    else if (field.type === 'multiselect') next[field.name] = Array.isArray(raw) ? raw : []
    else if (field.type === 'datetime-local') next[field.name] = toDatetimeLocal(raw)
    else if (field.type === 'file') next[field.name] = null
    else if (raw == null) next[field.name] = field.type === 'number' ? '' : field.type === 'checkbox' ? false : ''
    else next[field.name] = raw
  })
  return next
}

function OptionSelect({ field, value, onChange, onBlur, invalid }) {
  const staticOptions = field.options || []
  const fetched = useOptions(field.optionsEndpoint, {
    params: field.optionsParams,
    enabled: Boolean(field.optionsEndpoint),
    map: field.optionMap,
  })
  const options = field.optionsEndpoint ? fetched.options : staticOptions
  return (
    <select
      id={field.name}
      className="input"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-invalid={invalid || undefined}
      disabled={field.disabled}
    >
      <option value="">{field.placeholder || `Select ${field.label}`}</option>
      {options.map((opt) => (
        <option key={String(opt.value)} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function MultiSelect({ field, value = [], onChange }) {
  const staticOptions = field.options || []
  const fetched = useOptions(field.optionsEndpoint, {
    params: field.optionsParams,
    enabled: Boolean(field.optionsEndpoint),
    map: field.optionMap,
  })
  const options = field.optionsEndpoint ? fetched.options : staticOptions
  const selected = Array.isArray(value) ? value.map(String) : []
  return (
    <fieldset className="max-h-40 overflow-y-auto rounded-lg border border-slate-300 p-2 dark:border-slate-600">
      <legend className="sr-only">{field.label}</legend>
      {options.length === 0 ? (
        <p className="px-1 py-2 text-xs text-slate-500">No options yet</p>
      ) : (
        options.map((opt) => {
          const checked = selected.includes(String(opt.value))
          return (
            <label key={String(opt.value)} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, String(opt.value)]
                    : selected.filter((v) => v !== String(opt.value))
                  onChange(next)
                }}
              />
              {opt.label}
            </label>
          )
        })
      )}
    </fieldset>
  )
}

export default function DynamicForm({
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  onCancel,
  submitting = false,
  serverError,
}) {
  const schema = useMemo(() => schemaFromFields(fields), [fields])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: hydrate(fields, defaultValues),
  })

  useEffect(() => {
    form.reset(hydrate(fields, defaultValues))
  }, [defaultValues, fields]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (serverError) applyServerErrors(form.setError, serverError)
  }, [serverError, form.setError])

  const submit = form.handleSubmit(async (values) => {
    const payload = { ...values }
    fields.forEach((field) => {
      if (field.type === 'datetime-local') {
        payload[field.name] = fromDatetimeLocal(values[field.name])
      }
      if (field.type === 'number' && (values[field.name] === '' || values[field.name] == null)) {
        payload[field.name] = null
      }
      if (field.type === 'multiselect') {
        payload[field.name] = (values[field.name] || []).map((v) => (Number.isNaN(Number(v)) ? v : Number(v)))
      }
    })
    await onSubmit(payload, values)
  })

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const invalid = Boolean(form.formState.errors[field.name])
          const wide = field.type === 'textarea' || field.type === 'file' || field.wide || field.type === 'multiselect'
          return (
            <div key={field.name} className={wide ? 'sm:col-span-2' : ''}>
              {field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register(field.name)} />
                  {field.label}
                </label>
              ) : (
                <>
                  <label className="label" htmlFor={field.name}>
                    {field.label}
                    {field.required ? <span className="text-red-500"> *</span> : null}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      className="input min-h-[96px]"
                      aria-invalid={invalid || undefined}
                      disabled={field.disabled}
                      {...form.register(field.name)}
                    />
                  ) : field.type === 'select' ? (
                    <Controller
                      control={form.control}
                      name={field.name}
                      render={({ field: rhf }) => (
                        <OptionSelect field={field} value={rhf.value} onChange={rhf.onChange} onBlur={rhf.onBlur} invalid={invalid} />
                      )}
                    />
                  ) : field.type === 'multiselect' ? (
                    <Controller
                      control={form.control}
                      name={field.name}
                      render={({ field: rhf }) => <MultiSelect field={field} value={rhf.value} onChange={rhf.onChange} />}
                    />
                  ) : field.type === 'file' ? (
                    <Controller
                      control={form.control}
                      name={field.name}
                      render={({ field: rhf }) => (
                        <input
                          id={field.name}
                          type="file"
                          className="input"
                          accept={field.accept}
                          aria-invalid={invalid || undefined}
                          onChange={(e) => rhf.onChange(e.target.files?.[0] || null)}
                        />
                      )}
                    />
                  ) : (
                    <input
                      id={field.name}
                      type={field.type === 'datetime-local' ? 'datetime-local' : field.type || 'text'}
                      className="input"
                      aria-invalid={invalid || undefined}
                      disabled={field.disabled}
                      max={field.max}
                      min={field.min}
                      step={field.step}
                      {...form.register(field.name)}
                    />
                  )}
                </>
              )}
              {field.help ? <p className="help">{field.help}</p> : null}
              {form.formState.errors[field.name] ? (
                <p className="error-text">{form.formState.errors[field.name].message}</p>
              ) : null}
            </div>
          )
        })}
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
