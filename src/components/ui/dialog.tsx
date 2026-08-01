import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange, open])

  if (!open) return null
  return (
    <div className="dialog-backdrop" onMouseDown={() => onOpenChange(false)} role="presentation">
      <div
        className="dialog-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string
  title: string
  onClose: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-5">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="font-display text-3xl text-[var(--paper)]">{title}</h2>
      </div>
      <Button aria-label="关闭搜索" onClick={onClose} size="icon" variant="ghost">
        <X size={18} />
      </Button>
    </div>
  )
}
