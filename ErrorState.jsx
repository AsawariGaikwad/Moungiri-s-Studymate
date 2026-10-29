import { AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function ErrorState({ message = 'Could not load this page.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center" role="alert">
      <AlertTriangle className="mb-3 h-8 w-8 text-amber-500" aria-hidden="true" />
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
