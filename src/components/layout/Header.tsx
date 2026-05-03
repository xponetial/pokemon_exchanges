"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { ShoppingCart, ChevronDown, Search, Store, User, LogOut, Package, LayoutDashboard, ShieldCheck } from "lucide-react"
import { useCartStore } from "@/lib/cart/store"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Role = "admin" | "seller" | "buyer"

const roleBadge: Record<Role, { label: string; className: string }> = {
  admin:  { label: "Admin",  className: "bg-red-100 text-red-700" },
  seller: { label: "Seller", className: "bg-green-100 text-green-700" },
  buyer:  { label: "Buyer",  className: "bg-blue-100 text-blue-700" },
}

export function Header() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [role, setRole] = useState<Role>("buyer")
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const totalItems = useCartStore((s) => s.totalItems())

  async function fetchRole(userId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()
    if (data?.role) setRole(data.role as Role)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchRole(data.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      else setRole("buyer")
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push("/")
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/browse?q=${encodeURIComponent(query.trim())}`)
  }

  const displayName = user?.user_metadata?.full_name || user?.email || ""
  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">PE</span>
            </div>
            <span className="font-bold text-text text-lg hidden sm:block">
              Pokemon <span className="text-primary">Exchanges</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Pokémon cards, sets, grades..."
              className="flex-1 h-10 border border-border rounded-l px-4 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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

            {/* Admin link — only visible to admins */}
            {role === "admin" && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            )}

            {/* Sell */}
            <Link
              href="/seller/dashboard"
              className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded text-sm font-medium text-text-secondary hover:text-text hover:bg-surface transition-colors"
            >
              <Store className="w-4 h-4" />
              Sell
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 h-9 rounded text-sm font-medium text-text-secondary hover:text-text hover:bg-surface transition-colors"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[120px] truncate text-text">
                    {displayName.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 hidden sm:inline" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-text truncate">{displayName}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${roleBadge[role].className}`}>
                          {roleBadge[role].label}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{user.email}</p>
                    </div>
                    {role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface transition-colors"
                    >
                      <Package className="w-4 h-4 text-text-secondary" />
                      My Orders
                    </Link>
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-text-secondary" />
                      Seller Dashboard
                    </Link>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-surface transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 h-9 rounded text-sm font-medium text-text-secondary hover:text-text hover:bg-surface transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

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
