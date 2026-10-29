import { cn } from '@/lib/cn'
import Skeleton from '@/components/ui/Skeleton'

export default function StatCard({ icon: Icon, label, value, loading, className }) {
  return (
    <div className={cn('card flex items-start gap-4 p-5', className)}>
      {Icon ? (
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <p className="mt-1 truncate text-2xl font-semibold text-brand-900 dark:text-white">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}
