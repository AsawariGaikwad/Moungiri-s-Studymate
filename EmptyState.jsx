import { Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing to show yet',
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}>
      <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
