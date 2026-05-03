import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🎴</p>
        <h1 className="text-3xl font-bold text-text mb-2">Page not found</h1>
        <p className="text-text-secondary mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/"><Button>Back to Marketplace</Button></Link>
      </div>
    </div>
  )
}
