"use client"

import Link from "next/link"
import { BookOpen, Clock, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface BookCardProps {
  book: {
    id: string
    title: string
    theme: string
    status: string
    pageCount: number
    coverUrl: string | null
    createdAt: Date
    character?: { name: string } | null
  }
}

const BOOK_COLORS = [
  { bg: "#fef3e2", border: "#f5a876", emoji: "🌟" },
  { bg: "#e8f5e9", border: "#7bc8a4", emoji: "🌈" },
  { bg: "#fce4ec", border: "#f4a0b5", emoji: "🦋" },
  { bg: "#e3f2fd", border: "#8ec5d6", emoji: "⭐" },
  { bg: "#f3e5f5", border: "#c4a8d4", emoji: "🌸" },
  { bg: "#fff3e0", border: "#f5a876", emoji: "🌙" },
]

export function BookCard({ book }: BookCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const colorSet = BOOK_COLORS[book.id.charCodeAt(0) % BOOK_COLORS.length]

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Delete this book?")) return
    setDeleting(true)
    await fetch(`/api/books/${book.id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="book-card rounded-3xl overflow-hidden relative group"
      style={{ background: colorSet.bg, border: `2px solid ${colorSet.border}` }}>
      {/* Cover area */}
      <div className="h-48 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${colorSet.bg}, ${colorSet.border}20)` }}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-2">{colorSet.emoji}</div>
            {book.status === "generating" && (
              <div className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.8)", color: "#e8834a" }}>
                ✨ Generating...
              </div>
            )}
          </div>
        )}

        {/* Delete button */}
        <button onClick={handleDelete} disabled={deleting}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-50"
          style={{ color: "#e53e3e" }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <Link href={`/books/${book.id}`} className="block p-4">
        <h3 className="font-bold text-base mb-1 line-clamp-1" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
          {book.title || "Untitled Story"}
        </h3>
        {book.character && (
          <p className="text-xs mb-2" style={{ color: "#8b5e3c" }}>
            ⭐ Starring {book.character.name}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.6)", color: "#8b5e3c" }}>
            {book.theme}
          </span>
          <span className="text-xs" style={{ color: "#aaa" }}>
            {book.pageCount} pages
          </span>
        </div>
      </Link>
    </div>
  )
}
