import { Check, Circle } from 'lucide-react'
import { PASSWORD_RULES } from '@/lib/password'

export default function PasswordChecklist({ value }) {
  return (
    <ul className="mt-2 space-y-1" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-xs ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
          >
            {ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
