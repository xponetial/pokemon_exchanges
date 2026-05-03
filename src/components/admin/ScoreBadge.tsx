import { cn } from "@/lib/utils"

interface ScoreBadgeProps {
  score: number
  label?: string
  size?: "sm" | "md"
  className?: string
}

function scoreColor(score: number) {
  if (score >= 75) return "bg-green-100 text-green-800"
  if (score >= 50) return "bg-yellow-100 text-yellow-800"
  return "bg-red-100 text-red-700"
}

export function ScoreBadge({ score, label, size = "sm", className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        scoreColor(score),
        className
      )}
    >
      {label && <span className="font-normal opacity-70">{label}</span>}
      {score}
    </span>
  )
}

interface RecommendationBadgeProps {
  recommendation: "buy" | "watch" | "skip"
  className?: string
}

const recClasses: Record<string, string> = {
  buy:   "bg-green-600 text-white",
  watch: "bg-yellow-500 text-white",
  skip:  "bg-surface-hover text-text-secondary",
}

export function RecommendationBadge({ recommendation, className }: RecommendationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide",
        recClasses[recommendation] ?? recClasses.skip,
        className
      )}
    >
      {recommendation}
    </span>
  )
}
