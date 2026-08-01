import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

type TabsContextValue = { value: string; onValueChange: (value: string) => void }
const TabsContext = createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onValueChange,
  children,
  ...props
}: {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex gap-6 border-b border-[var(--line)]', className)}
      role="tablist"
      {...props}
    />
  )
}

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: { value: string; children: ReactNode } & HTMLAttributes<HTMLButtonElement>) {
  const tabs = useContext(TabsContext)
  if (!tabs) throw new Error('TabsTrigger must be used inside Tabs')
  const active = tabs.value === value
  return (
    <button
      className={cn('archive-tab', active && 'archive-tab-active', className)}
      onClick={() => tabs.onValueChange(value)}
      role="tab"
      aria-selected={active}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: { value: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const tabs = useContext(TabsContext)
  if (!tabs || tabs.value !== value) return null
  return (
    <div className={className} role="tabpanel" {...props}>
      {children}
    </div>
  )
}
