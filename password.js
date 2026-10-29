export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v) => (v || '').length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v || '') },
  { id: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v || '') },
  { id: 'number', label: 'One number', test: (v) => /[0-9]/.test(v || '') },
  { id: 'special', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v || '') },
]

export function passwordMeetsRules(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value))
}
