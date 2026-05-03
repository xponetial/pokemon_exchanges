import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ListingCard } from "@/components/cards/ListingCard"
import { ShieldCheck, TrendingDown, Zap, BadgeCheck, Search, Tag, Truck } from "lucide-react"
import type { ListingWithSeller } from "@/lib/types/database"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pokemon Exchanges — Buy & Sell Pokémon Cards",
  description: "The marketplace built for serious Pokémon card collectors. Buy and sell graded and raw cards with secure payments and buyer protection.",
}

async function FeaturedListings() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from("listings")
    .select("*, sellers(display_name, rating)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8)

  if (!listings || listings.length === 0) return null

  return (
    <section className="py-12">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text">Recently Listed</h2>
          <Link href="/browse" className="text-primary text-sm font-medium hover:underline">
            See all cards →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(listings as unknown as ListingWithSeller[]).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  )
}

const valueProps = [
  {
    icon: ShieldCheck,
    title: "Buyer Protection",
    body: "Every purchase is covered. If your card doesn't arrive or isn't as described, we'll make it right.",
  },
  {
    icon: BadgeCheck,
    title: "Graded Card Experts",
    body: "PSA, BGS, CGC, and SGC grades verified. Filter by company, grade, and condition with confidence.",
  },
  {
    icon: TrendingDown,
    title: "Low 10% Fee",
    body: "Sellers keep 90% of every sale. No listing fees, no hidden charges — just a simple commission.",
  },
  {
    icon: Zap,
    title: "Fast & Secure",
    body: "Payments held in escrow until you confirm delivery. Funds released to sellers once the buyer is happy.",
  },
]

const howItWorksSteps = [
  {
    icon: Search,
    step: "1",
    title: "Browse & Filter",
    body: "Search thousands of listings by card name, set, grade, condition, or price range.",
  },
  {
    icon: Tag,
    step: "2",
    title: "Buy with Confidence",
    body: "Checkout securely. Payment is held in escrow until your card arrives safely.",
  },
  {
    icon: Truck,
    step: "3",
    title: "Card Delivered",
    body: "Seller ships with tracking. Confirm receipt and funds are released. Simple.",
  },
]

export default function LandingPage() {
  return (
    <div className="-mx-4 -my-6">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1877f2 0%, #0d5fcf 60%, #0a4db0 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full opacity-10 bg-white" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
            The Pokémon Card Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
            Buy &amp; Sell Pokémon Cards{" "}
            <span className="text-yellow-300">with Confidence</span>
          </h1>
          <p className="mt-5 text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
            Graded slabs. Raw cards. Vintage classics. Modern pulls. One secure marketplace for serious collectors.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-white text-primary font-bold text-base hover:bg-blue-50 transition-colors shadow-lg"
            >
              Browse Cards
            </Link>
            <Link
              href="/seller/onboarding"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg border-2 border-white/60 text-white font-bold text-base hover:bg-white/10 transition-colors"
            >
              Start Selling
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-blue-100 text-sm">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-yellow-300" /> Buyer Protection</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-yellow-300" /> PSA · BGS · CGC · SGC</span>
            <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-yellow-300" /> Only 10% Seller Fee</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-300" /> Secure Escrow Payments</span>
          </div>
        </div>
      </section>

      {/* ── Featured listings (only renders if cards exist) ── */}
      <div className="bg-surface">
        <FeaturedListings />
      </div>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-text text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorksSteps.map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-text mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Props ──────────────────────────────────────── */}
      <section className="py-16 bg-surface">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-text text-center mb-10">Why Pokemon Exchanges</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-border shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-text mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Sellers CTA ──────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-border">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary to-[#0d5fcf] rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to sell your collection?</h2>
            <p className="text-blue-100 text-base mb-7 max-w-md mx-auto">
              List your cards in minutes. Keep 90% of every sale. Get paid securely after delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-11 px-7 rounded-lg bg-white text-primary font-bold hover:bg-blue-50 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                href="/seller/onboarding"
                className="inline-flex items-center justify-center h-11 px-7 rounded-lg border-2 border-white/60 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
