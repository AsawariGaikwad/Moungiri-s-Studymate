import { cn } from '@/lib/cn'

export default function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-semibold text-brand-900 dark:text-white">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
