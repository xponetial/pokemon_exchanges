"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CATEGORY_LINKS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function CategoryNav() {
  const params = useSearchParams()

  function isActive(href: string): boolean {
    if (href === "/") return !params.toString()
    const url = new URL(href, "http://x")
    return [...url.searchParams.entries()].every(
      ([k, v]) => params.get(k) === v
    )
  }

  return (
    <nav className="bg-white border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4">
        <ul className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-none">
          {CATEGORY_LINKS.map((link) => (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={cn(
                  "px-3 h-full flex items-center text-sm font-medium rounded transition-colors whitespace-nowrap",
                  isActive(link.href)
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-secondary hover:text-text hover:bg-surface"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
