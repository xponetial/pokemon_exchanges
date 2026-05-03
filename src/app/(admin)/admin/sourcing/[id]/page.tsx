import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, ArrowLeft } from "lucide-react"
import { ScoreBadge, RecommendationBadge } from "@/components/admin/ScoreBadge"
import { formatPriceDollars } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Deal Detail — Admin" }

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin/sourcing")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/admin")

  const adminClient = await createAdminClient()
  const { data: listing } = await adminClient
    .from("external_listings")
    .select("*, deal_scores(*)")
    .eq("id", id)
    .single()

  if (!listing) notFound()

  const { data: aggPrice } = await adminClient
    .from("aggregated_prices")
    .select("*")
    .eq("external_listing_id", id)
    .single()

  const score = listing.deal_scores?.[0] ?? null
  const savings = listing.market_price ? listing.market_price - listing.price : null

  return (
    <div>
      <Link href="/admin/sourcing" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Sourcing
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Image */}
        <div className="md:col-span-1">
          <div className="relative aspect-[3/4] bg-surface rounded border border-border overflow-hidden">
            {listing.image_url ? (
              <Image src={listing.image_url} alt={listing.title} fill className="object-contain p-4" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">No Image</div>
            )}
          </div>
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-3 w-full py-2.5 bg-primary text-white text-sm font-semibold rounded hover:bg-primary-hover transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on {listing.source === "ebay" ? "eBay" : "TCGplayer"}
          </a>
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase bg-surface-hover text-text-secondary px-2 py-0.5 rounded">
                {listing.source}
              </span>
              <span className="text-xs text-text-muted capitalize">{listing.status}</span>
            </div>
            <h1 className="text-xl font-bold text-text mb-1">{listing.title}</h1>
            {listing.card_name && (
              <p className="text-text-secondary text-sm">
                {listing.card_name}{listing.set_name ? ` · ${listing.set_name}` : ""}
                {listing.card_number ? ` #${listing.card_number}` : ""}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-surface rounded border border-border p-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Asking Price</p>
                <p className="text-2xl font-bold text-text">{formatPriceDollars(listing.price)}</p>
                {listing.shipping_cost != null && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {listing.shipping_cost === 0 ? "Free shipping" : `+ ${formatPriceDollars(listing.shipping_cost)} shipping`}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Fair Value</p>
                {listing.market_price ? (
                  <>
                    <p className="text-2xl font-bold text-text">{formatPriceDollars(listing.market_price)}</p>
                    {savings && savings > 0 && (
                      <p className="text-xs font-semibold text-green-700 mt-0.5">
                        Save {formatPriceDollars(savings)} ({Math.round(listing.price_diff_percent!)}% below market)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-text-muted">Not available</p>
                )}
              </div>
            </div>

            {aggPrice && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Price Sources</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-secondary">Confidence:</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      aggPrice.confidence_score >= 70
                        ? "bg-green-100 text-green-800"
                        : aggPrice.confidence_score >= 40
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {aggPrice.confidence_score}/100
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">TCGplayer</p>
                    <p className="font-medium text-text">
                      {aggPrice.tcgplayer_price != null ? formatPriceDollars(aggPrice.tcgplayer_price) : <span className="text-text-muted">—</span>}
                    </p>
                    {aggPrice.weights && typeof aggPrice.weights === "object" && !Array.isArray(aggPrice.weights) && (aggPrice.weights as Record<string, number>).tcgplayer != null && (
                      <p className="text-xs text-text-muted">{Math.round(((aggPrice.weights as Record<string, number>).tcgplayer) * 100)}% weight</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">PriceCharting</p>
                    <p className="font-medium text-text">
                      {aggPrice.pricecharting_price != null ? formatPriceDollars(aggPrice.pricecharting_price) : <span className="text-text-muted">—</span>}
                    </p>
                    {aggPrice.weights && typeof aggPrice.weights === "object" && !Array.isArray(aggPrice.weights) && (aggPrice.weights as Record<string, number>).pricecharting != null && (
                      <p className="text-xs text-text-muted">{Math.round(((aggPrice.weights as Record<string, number>).pricecharting) * 100)}% weight</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">eBay Comps</p>
                    <p className="font-medium text-text">
                      {aggPrice.ebay_comps_price != null ? formatPriceDollars(aggPrice.ebay_comps_price) : <span className="text-text-muted">—</span>}
                    </p>
                    <p className="text-xs text-text-muted italic">Phase 2e</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seller */}
          <div className="bg-surface rounded border border-border p-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Seller</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary">Name</p>
                <p className="font-medium text-text">{listing.seller_name ?? "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Feedback</p>
                <p className="font-medium text-text">
                  {listing.seller_feedback_percent != null ? `${listing.seller_feedback_percent}%` : "—"}
                  {listing.seller_feedback_score != null ? ` (${listing.seller_feedback_score.toLocaleString()})` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Condition</p>
                <p className="font-medium text-text">{listing.condition ?? "Not specified"}</p>
              </div>
              {listing.grading_company && (
                <div>
                  <p className="text-xs text-text-secondary">Grade</p>
                  <p className="font-medium text-text">{listing.grading_company} {listing.grade}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Score */}
          <div className="bg-surface rounded border border-border p-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">AI Deal Score</h2>
            {score ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <RecommendationBadge recommendation={score.recommendation ?? "skip"} />
                  <ScoreBadge score={score.overall_score} size="md" label="Overall" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <ScoreBadge score={score.value_score} label="Value" size="md" />
                  <ScoreBadge score={score.risk_score} label="Risk" size="md" />
                  <ScoreBadge score={score.authenticity_score} label="Auth" size="md" />
                </div>
                {score.reasoning && (
                  <p className="text-sm text-text-secondary">{score.reasoning}</p>
                )}
                {score.flags && score.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {score.flags.map((flag: string) => (
                      <span key={flag} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                        {flag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-text-muted">Scored by {score.model_used}</p>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                This listing has not been scored yet.{" "}
                <Link href="/admin/sourcing" className="text-primary hover:underline">
                  Go to Sourcing to score it.
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
