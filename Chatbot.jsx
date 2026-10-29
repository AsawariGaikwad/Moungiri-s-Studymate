import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/api/client'
import { useGet } from '@/hooks/useGet'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/cn'

export default function Chatbot() {
  const history = useGet(['chatbot', 'history'], '/chatbot/history')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [local, setLocal] = useState([])
  const [notice, setNotice] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const bottom = useRef(null)

  const items = [...(Array.isArray(history.data?.data) ? history.data.data : []), ...local]

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items.length])

  const send = async (e) => {
    e.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessage('')
    setPending(true)
    setLocal((prev) => [...prev, { role: 'user', message: text, id: `u-${Date.now()}` }])
    try {
      const res = await api.post('/chatbot/ask', { message: text })
      const reply = res.data?.data?.reply
      setLocal((prev) => [...prev, { role: 'assistant', message: reply, id: `a-${Date.now()}` }])
      setNotice(null)
      history.refetch()
    } catch (err) {
      if (err.response?.status === 503 && getErrorCode(err) === 'ai_not_configured') {
        setNotice(getErrorMessage(err))
      } else {
        toast.error(getErrorMessage(err))
      }
    } finally {
      setPending(false)
    }
  }

  const clear = async () => {
    try {
      await api.delete('/chatbot/history')
      setLocal([])
      history.refetch()
      toast.success('Chat history cleared')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirmClear(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <PageHeader
        title="AI Chatbot"
        description="Ask study questions. History is stored on the server."
        actions={
          <Button variant="outline" onClick={() => setConfirmClear(true)}>
            Clear history
          </Button>
        }
      />
      {history.isError ? <ErrorState message={getErrorMessage(history.error)} onRetry={() => history.refetch()} /> : null}
      {notice ? (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">{notice}</p>
      ) : null}
      <div className="card flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
          {!history.isLoading && items.length === 0 ? <EmptyState title="No messages yet" description="Ask a question to get started." /> : null}
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                item.role === 'user' || item.sender === 'user'
                  ? 'ml-auto bg-brand-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800',
              )}
            >
              {item.message || item.content || item.reply}
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
          <label className="sr-only" htmlFor="chat-message">
            Message
          </label>
          <input
            id="chat-message"
            className="input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a question"
            disabled={pending}
          />
          <Button type="submit" loading={pending}>
            Send
          </Button>
        </form>
      </div>
      <ConfirmDialog
        open={confirmClear}
        title="Clear chat history?"
        message="All previous messages will be removed."
        danger
        confirmLabel="Clear"
        onClose={() => setConfirmClear(false)}
        onConfirm={clear}
      />
    </div>
  )
}
