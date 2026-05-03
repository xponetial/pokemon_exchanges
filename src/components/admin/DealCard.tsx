"use client"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Bookmark, TrendingDown } from "lucide-react"
import { ScoreBadge, RecommendationBadge } from "@/components/admin/ScoreBadge"
import { formatPriceDollars } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { ExternalListingWithScore } from "@/lib/types/database"

interface DealCardProps {
  listing: ExternalListingWithScore
  onWatchlist?: (id: string) => void
  isWatchlisted?: boolean
}

export function DealCard({ listing, onWatchlist, isWatchlisted }: DealCardProps) {
  const score = listing.deal_scores?.[0]
  const savings = listing.market_price && listing.price_diff_percent != null
    ? listing.market_price - listing.price
    : null

  return (
    <div className="bg-white rounded border border-border hover:border-border-hover hover:shadow-md transition-all flex flex-col">
      {/* Image */}
      <Link href={`/admin/sourcing/${listing.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-t bg-surface">
        {listing.image_url ? (
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-xs">
            No Image
          </div>
        )}
        {/* Source badge */}
        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
          {listing.source}
        </span>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link href={`/admin/sourcing/${listing.id}`} className="block">
          <p className="text-sm font-medium text-text line-clamp-2 leading-snug hover:text-primary">
            {listing.title}
          </p>
          {listing.set_name && (
            <p className="text-xs text-text-secondary mt-0.5">{listing.set_name}</p>
          )}
        </Link>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-text">{formatPriceDollars(listing.price)}</span>
          {listing.market_price && (
            <span className="text-xs text-text-secondary line-through">
              {formatPriceDollars(listing.market_price)}
            </span>
          )}
          {savings && savings > 0 && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-green-700">
              <TrendingDown className="w-3 h-3" />
              {Math.round(listing.price_diff_percent!)}% below
            </span>
          )}
        </div>

        {/* Scores */}
        {score ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <RecommendationBadge recommendation={score.recommendation ?? "skip"} />
            <ScoreBadge score={score.overall_score} />
          </div>
        ) : (
          <span className="text-xs text-text-muted italic">Not scored yet</span>
        )}

        {/* Seller */}
        {listing.seller_name && (
          <p className={cn(
            "text-xs",
            (listing.seller_feedback_percent ?? 100) >= 98
              ? "text-green-700"
              : (listing.seller_feedback_percent ?? 100) >= 95
              ? "text-yellow-700"
              : "text-red-600"
          )}>
            {listing.seller_name} · {listing.seller_feedback_percent ?? "?"}% feedback
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> View on {listing.source}
          </a>
          {onWatchlist && (
            <button
              onClick={() => onWatchlist(listing.id)}
              className={cn(
                "ml-auto p-1.5 rounded hover:bg-surface transition-colors",
                isWatchlisted ? "text-primary" : "text-text-muted"
              )}
              title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Bookmark className={cn("w-4 h-4", isWatchlisted && "fill-primary")} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
