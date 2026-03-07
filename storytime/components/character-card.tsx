"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface CharacterCardProps {
  character: {
    id: string
    name: string
    age: number
    gender: string
    hairColor: string
    eyeColor: string
    personality: string
    hobbies: string
  }
}

const HAIR_COLORS: Record<string, string> = {
  blonde: "#f5d76e",
  brown: "#8b5e3c",
  black: "#2c2c2c",
  red: "#c0392b",
  auburn: "#a0522d",
  gray: "#95a5a6",
}

const SKIN_TONES: Record<string, string> = {
  light: "#fce4c9",
  "light-medium": "#f4c999",
  medium: "#e0a87c",
  "medium-dark": "#c47d52",
  dark: "#8b5e3c",
}

export function CharacterCard({ character }: CharacterCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const personality = JSON.parse(character.personality || "[]")

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete ${character.name}?`)) return
    setDeleting(true)
    await fetch(`/api/characters/${character.id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="book-card rounded-3xl overflow-hidden relative group"
      style={{ background: "white", border: "2px solid #f0e6d3" }}>
      {/* Character avatar */}
      <div className="h-32 flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, #fef3e2, #fce4ec)" }}>
        <div className="text-6xl">
          {character.gender === "girl" ? "👧" : character.gender === "boy" ? "👦" : "🧒"}
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-50"
          style={{ color: "#e53e3e" }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <Link href={`/characters/${character.id}`} className="block p-4">
        <h3 className="font-bold text-lg mb-1" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
          {character.name}
        </h3>
        <p className="text-sm mb-3" style={{ color: "#8b5e3c" }}>
          {character.age} years old · {character.gender}
        </p>
        <div className="flex flex-wrap gap-1">
          {personality.slice(0, 3).map((trait: string) => (
            <span key={trait} className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(232, 131, 74, 0.1)", color: "#e8834a" }}>
              {trait}
            </span>
          ))}
        </div>
      </Link>
    </div>
  )
}
