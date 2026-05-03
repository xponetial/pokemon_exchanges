import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-6">
          <div>
            <p className="font-semibold text-text mb-2">Marketplace</p>
            <ul className="space-y-1 text-text-secondary">
              <li><Link href="/browse" className="hover:text-primary">Browse Cards</Link></li>
              <li><Link href="/browse?sort=newest" className="hover:text-primary">New Listings</Link></li>
              <li><Link href="/browse?sort=price_asc" className="hover:text-primary">Deals</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-text mb-2">Sell</p>
            <ul className="space-y-1 text-text-secondary">
              <li><Link href="/seller/onboarding" className="hover:text-primary">Start Selling</Link></li>
              <li><Link href="/seller/dashboard" className="hover:text-primary">Seller Dashboard</Link></li>
              <li><Link href="/seller/listings/new" className="hover:text-primary">Create Listing</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-text mb-2">Account</p>
            <ul className="space-y-1 text-text-secondary">
              <li><Link href="/orders" className="hover:text-primary">My Orders</Link></li>
              <li><Link href="/login" className="hover:text-primary">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-primary">Create Account</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-text mb-2">About</p>
            <ul className="space-y-1 text-text-secondary">
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/fees" className="hover:text-primary">Fees</Link></li>
              <li><Link href="/trust" className="hover:text-primary">Buyer Protection</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} Pokemon Exchanges. All rights reserved.</p>
          <p>Platform fee: 10% per transaction · Secure payments via Stripe Connect</p>
        </div>
      </div>
    </footer>
  )
}
