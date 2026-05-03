import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { AdminNav } from "@/components/admin/AdminNav"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 py-8 flex gap-8">
          <AdminNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  )
}
