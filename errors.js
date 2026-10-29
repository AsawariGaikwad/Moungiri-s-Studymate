export function getErrorCode(err) {
  return err?.response?.data?.error ?? null
}

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const code = getErrorCode(err)
  if (code === 'ai_not_configured') {
    return 'The AI assistant is not configured yet. Please try again later or contact your administrator.'
  }
  if (code === 'password_change_required') {
    return 'You must change your temporary password before continuing.'
  }
  return err?.response?.data?.message || err?.message || fallback
}

export function getFieldErrors(err) {
  const details = err?.response?.data?.details
  if (!details || typeof details !== 'object') return {}
  const mapped = {}
  for (const [field, messages] of Object.entries(details)) {
    if (Array.isArray(messages) && messages.length) mapped[field] = messages[0]
    else if (typeof messages === 'string') mapped[field] = messages
  }
  return mapped
}

export function applyServerErrors(setError, err) {
  const fields = getFieldErrors(err)
  Object.entries(fields).forEach(([name, message]) => {
    setError(name, { type: 'server', message })
  })
  return Object.keys(fields).length > 0
}
