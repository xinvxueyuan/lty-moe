import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--pink)] text-[var(--ink)] hover:bg-[#ff9cc2]',
        outline:
          'border border-[var(--line)] bg-transparent text-[var(--paper)] hover:border-[var(--cyan)] hover:text-[var(--cyan)]',
        ghost: 'bg-transparent text-[var(--muted)] hover:text-[var(--paper)]',
        soft: 'bg-[var(--panel)] text-[var(--paper)] hover:bg-[var(--panel-strong)]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-5',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} type={type} {...props} />
  )
}
