"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ShoppingCart, User, ChevronDown, Search, Store } from "lucide-react"
import { useCartStore } from "@/lib/cart/store"
import { createClient } from "@/lib/supabase/client"

export function Header() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const totalItems = useCartStore((s) => s.totalItems())
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">PE</span>
            </div>
            <span className="font-bold text-text text-lg hidden sm:block leading-tight">
              Pokemon<br className="hidden" />{" "}
              <span className="text-primary">Exchanges</span>
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Pokémon cards, sets, grades..."
              className="flex-1 h-10 border border-border rounded-l px-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="submit"
              className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-r flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sell */}
            <Link
              href="/seller/dashboard"
              className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded text-sm font-medium text-text-secondary hover:text-text hover:bg-surface transition-colors"
            >
              <Store className="w-4 h-4" />
              Sell
            </Link>

            {/* Account */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 h-9 rounded text-sm font-medium text-text-secondary hover:text-text hover:bg-surface transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
              <ChevronDown className="w-3 h-3 hidden sm:inline" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 px-3 h-9 rounded text-sm font-medium text-text-secondary hover:text-text hover:bg-surface transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  )
}
