import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function CopyDialog({ open, title, label, value, onClose }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value || '')
      setCopied(true)
      toast.success('Copied')
    } catch {
      toast.error('Could not copy. Select the text instead.')
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={() => {
        setCopied(false)
        onClose?.()
      }}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-3 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">{value}</p>
      <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">This value is shown only once. Copy it now.</p>
    </Modal>
  )
}
