import { cn } from '@/lib/cn'

const tones = {
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-brand-100',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  blue: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
}

export default function Badge({ tone = 'brand', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone] || tones.brand,
        className,
      )}
    >
      {children}
    </span>
  )
}
