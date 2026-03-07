"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { BookOpen, Menu, X, Sparkles, User } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(253, 248, 240, 0.95)", backdropFilter: "blur(10px)", borderBottom: "2px solid rgba(232, 131, 74, 0.15)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform" style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
              📚
            </div>
            <span className="text-xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
              StoryTime
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#how-it-works" className="text-sm font-semibold hover:text-orange-500 transition-colors" style={{ color: "#8b5e3c" }}>
              How It Works
            </Link>
            <Link href="/#pricing" className="text-sm font-semibold hover:text-orange-500 transition-colors" style={{ color: "#8b5e3c" }}>
              Pricing
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-semibold hover:text-orange-500 transition-colors" style={{ color: "#8b5e3c" }}>
                  My Books
                </Link>
                <Link href="/create" className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)", boxShadow: "0 4px 15px rgba(232, 131, 74, 0.3)" }}>
                  <Sparkles className="w-4 h-4" />
                  Create Book
                </Link>
                <button onClick={() => signOut()} className="text-sm font-semibold hover:text-orange-500 transition-colors" style={{ color: "#8b5e3c" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold hover:text-orange-500 transition-colors" style={{ color: "#8b5e3c" }}>
                  Sign In
                </Link>
                <Link href="/signup" className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)", boxShadow: "0 4px 15px rgba(232, 131, 74, 0.3)" }}>
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg" style={{ color: "#8b5e3c" }}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden py-4 border-t flex flex-col gap-3" style={{ borderColor: "rgba(232, 131, 74, 0.15)" }}>
            <Link href="/#how-it-works" className="text-sm font-semibold px-2 py-1" style={{ color: "#8b5e3c" }} onClick={() => setIsOpen(false)}>How It Works</Link>
            <Link href="/#pricing" className="text-sm font-semibold px-2 py-1" style={{ color: "#8b5e3c" }} onClick={() => setIsOpen(false)}>Pricing</Link>
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-semibold px-2 py-1" style={{ color: "#8b5e3c" }} onClick={() => setIsOpen(false)}>My Books</Link>
                <Link href="/create" className="text-sm font-semibold px-2 py-1 text-orange-500" onClick={() => setIsOpen(false)}>Create Book</Link>
                <button onClick={() => signOut()} className="text-sm font-semibold text-left px-2 py-1" style={{ color: "#8b5e3c" }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold px-2 py-1" style={{ color: "#8b5e3c" }} onClick={() => setIsOpen(false)}>Sign In</Link>
                <Link href="/signup" className="text-sm font-bold text-orange-500 px-2 py-1" onClick={() => setIsOpen(false)}>Get Started Free</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
