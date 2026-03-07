import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen" style={{ background: "#fdf8f0" }}>
      <Navbar />
      <main className="pt-20 px-4 max-w-7xl mx-auto pb-16">
        {children}
      </main>
    </div>
  )
}
