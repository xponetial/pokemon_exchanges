import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"
import type { Profile } from "@/lib/types/database"

export const metadata: Metadata = { title: "Users — Admin" }

const roleVariant: Record<Profile["role"], "default" | "primary" | "success"> = {
  buyer:  "default",
  seller: "primary",
  admin:  "success",
}

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin/users")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/admin")

  const adminClient = await createAdminClient()
  const { data: users } = await adminClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  const profiles = (users ?? []) as Profile[]

  const roleCounts = profiles.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Users</h1>
      <p className="text-text-secondary text-sm mb-6">All registered platform users.</p>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(["buyer", "seller", "admin"] as Profile["role"][]).map((role) => (
          <div key={role} className="bg-white rounded border border-border p-4">
            <p className="text-xs text-text-secondary capitalize mb-1">{role}s</p>
            <p className="text-2xl font-bold text-text">{roleCounts[role] ?? 0}</p>
          </div>
        ))}
      </div>

      {profiles.length === 0 ? (
        <div className="bg-surface rounded border border-border p-14 text-center">
          <Users className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No users yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["User", "Email", "Role", "Joined"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold">
                          {(p.full_name ?? p.email)[0].toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-text">{p.full_name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant[p.role]}>{p.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
