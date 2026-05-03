import { cn } from "@/lib/utils"
import { forwardRef } from "react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { label: string; value: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 w-full rounded border border-border bg-white px-3 text-sm text-text",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            error && "border-danger focus:ring-danger",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"
