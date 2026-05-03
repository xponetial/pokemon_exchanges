import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">{children}</main>
      <Footer />
    </>
  )
}
