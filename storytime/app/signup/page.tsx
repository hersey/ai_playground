"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      router.push("/dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #fdf8f0 50%, #fce4ec 100%)" }}>
      <div className="absolute top-20 right-10 text-5xl float-animation">🌟</div>
      <div className="absolute bottom-20 left-10 text-5xl float-animation" style={{ animationDelay: "1.5s" }}>🦋</div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl">📚</span>
            <span className="text-3xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>StoryTime</span>
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "#3d2b1f" }}>Start your story journey!</h1>
          <p className="text-sm mt-1" style={{ color: "#8b5e3c" }}>Free to start — no credit card needed</p>
        </div>

        <div className="rounded-3xl p-8 shadow-xl" style={{ background: "white", boxShadow: "0 20px 60px rgba(61, 43, 31, 0.1)" }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: "#fce4ec", color: "#c62828" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: "#3d2b1f" }}>Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ border: "2px solid #f0e6d3", background: "#fdf8f0", color: "#3d2b1f", fontFamily: "inherit" }}
                onFocus={(e) => e.target.style.borderColor = "#e8834a"}
                onBlur={(e) => e.target.style.borderColor = "#f0e6d3"}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: "#3d2b1f" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ border: "2px solid #f0e6d3", background: "#fdf8f0", color: "#3d2b1f", fontFamily: "inherit" }}
                onFocus={(e) => e.target.style.borderColor = "#e8834a"}
                onBlur={(e) => e.target.style.borderColor = "#f0e6d3"}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: "#3d2b1f" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ border: "2px solid #f0e6d3", background: "#fdf8f0", color: "#3d2b1f", fontFamily: "inherit" }}
                onFocus={(e) => e.target.style.borderColor = "#e8834a"}
                onBlur={(e) => e.target.style.borderColor = "#f0e6d3"}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-full text-white font-bold text-base transition-all hover:scale-105 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)", boxShadow: "0 4px 15px rgba(232, 131, 74, 0.3)" }}
            >
              {loading ? "Creating your account... ✨" : "Create Free Account 🚀"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "#f0e6d3" }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 font-medium" style={{ background: "white", color: "#8b5e3c" }}>or</span>
            </div>
          </div>

          <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-105"
            style={{ border: "2px solid #f0e6d3", color: "#3d2b1f" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-sm mt-6" style={{ color: "#8b5e3c" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-bold hover:underline" style={{ color: "#e8834a" }}>Sign in</Link>
          </p>

          <p className="text-center text-xs mt-4" style={{ color: "#aaa" }}>
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
