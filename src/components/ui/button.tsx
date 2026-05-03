"use client"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:   "bg-primary text-white hover:bg-primary-hover",
        secondary: "bg-surface-hover text-text border border-border hover:bg-border",
        outline:   "border border-primary text-primary bg-white hover:bg-primary-light",
        ghost:     "text-text-secondary hover:bg-surface-hover hover:text-text",
        danger:    "bg-danger text-white hover:bg-red-600",
        link:      "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = "Button"
