import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-white rounded-lg border border-border p-10 w-full max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text mb-2">Order Placed!</h1>
        <p className="text-text-secondary mb-2">
          Your order has been received and the seller has been notified.
        </p>
        <p className="text-sm text-text-secondary mb-6">
          Payment will be collected once Stripe Connect is configured.
          You&apos;ll receive an email with tracking once the seller ships.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/orders"><Button className="w-full">View My Orders</Button></Link>
          <Link href="/"><Button variant="secondary" className="w-full">Continue Shopping</Button></Link>
        </div>
      </div>
    </div>
  )
}
