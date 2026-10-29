import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/errors'

export function useAction(options = {}) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: async (data, variables, context) => {
      if (options.successMessage) {
        const message =
          typeof options.successMessage === 'function'
            ? options.successMessage(data, variables)
            : options.successMessage
        if (message) toast.success(message)
      }
      const keys = options.invalidate
        ? Array.isArray(options.invalidate[0]) || typeof options.invalidate[0] === 'string'
          ? Array.isArray(options.invalidate[0])
            ? options.invalidate
            : [options.invalidate]
          : options.invalidate
        : []
      const list = Array.isArray(options.invalidate)
        ? options.invalidate.some(Array.isArray)
          ? options.invalidate
          : [options.invalidate]
        : options.invalidate
          ? [options.invalidate]
          : []
      await Promise.all(list.map((k) => qc.invalidateQueries({ queryKey: k })))
      await options.onSuccess?.(data, variables, context)
    },
    onError: (err, variables, context) => {
      if (!options.silentError) {
        toast.error(getErrorMessage(err, options.errorMessage))
      }
      options.onError?.(err, variables, context)
    },
  })
}
