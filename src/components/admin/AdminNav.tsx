"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Search, Bookmark, Package, BarChart2, Users, LayoutDashboard } from "lucide-react"

const links = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/sourcing",  label: "Sourcing",   icon: Search },
  { href: "/admin/watchlist", label: "Watchlist",  icon: Bookmark },
  { href: "/admin/inventory", label: "Inventory",  icon: Package },
  { href: "/admin/analytics", label: "Analytics",  icon: BarChart2 },
  { href: "/admin/users",     label: "Users",      icon: Users },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="w-48 shrink-0">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 px-3">
        Admin
      </p>
      <ul className="space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-surface hover:text-text"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
