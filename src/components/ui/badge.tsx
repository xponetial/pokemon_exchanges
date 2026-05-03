import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "psa" | "bgs" | "cgc"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-surface-hover text-text-secondary",
  primary:  "bg-primary-light text-primary",
  success:  "bg-green-100 text-success",
  warning:  "bg-yellow-100 text-warning",
  danger:   "bg-danger-light text-danger",
  psa:      "bg-red-700 text-white",
  bgs:      "bg-blue-900 text-white",
  cgc:      "bg-purple-800 text-white",
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  )
}
