"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Store, CheckCircle } from "lucide-react"

export default function SellerOnboardingPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push("/login?redirect=/seller/onboarding"); return }

    const { error: sellerError } = await supabase.from("sellers").upsert({
      id: user.id,
      display_name: displayName,
      bio,
    })

    await supabase.from("profiles").update({ role: "seller" }).eq("id", user.id)

    setLoading(false)
    if (sellerError) { setError(sellerError.message); return }
    router.push("/seller/dashboard")
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-white rounded-lg border border-border p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text">Set up your seller profile</h1>
          <p className="text-text-secondary text-sm mt-1">
            Start listing and selling Pokémon cards on Pokemon Exchanges
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-surface rounded-lg p-4 mb-6 space-y-2">
          {["List cards for free", "Keep ~90% of each sale", "Secure payouts via Stripe (coming soon)", "Buyer protection for all transactions"].map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle className="w-4 h-4 text-success shrink-0" />
              {b}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Kanto Cards Co."
            required
            hint="This is what buyers will see on your listings"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text">Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell buyers a bit about yourself and what you sell..."
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Create Seller Profile
          </Button>
        </form>
      </div>
    </div>
  )
}
