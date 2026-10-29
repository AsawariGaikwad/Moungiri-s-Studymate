import { cn } from '@/lib/cn'

const variants = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-600 disabled:bg-brand-700/60 shadow-sm',
  accent: 'bg-accent-500 text-brand-900 hover:bg-accent-400 disabled:bg-accent-500/60 font-semibold',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  outline:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-800',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/60',
}

export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  className,
  loading = false,
  disabled,
  children,
  type,
  ...props
}) {
  return (
    <Comp
      type={Comp === 'button' ? type || 'button' : type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none disabled:cursor-not-allowed',
        variants[variant] || variants.primary,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </Comp>
  )
}
