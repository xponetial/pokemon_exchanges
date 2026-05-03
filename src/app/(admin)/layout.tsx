import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </>
  )
}
