import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CharacterCard } from "@/components/character-card"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function CharactersPage() {
  const session = await getServerSession(authOptions)

  const characters = await prisma.character.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
          🧒 My Characters
        </h1>
        <Link href="/characters/new" className="flex items-center gap-2 px-5 py-2 rounded-full text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #7bc8a4, #a8dbc4)" }}>
          <Plus className="w-4 h-4" /> New Character
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "white", border: "2px dashed #f0e6d3" }}>
          <div className="text-6xl mb-4">🧒</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f" }}>No characters yet!</h3>
          <p className="text-sm mb-6" style={{ color: "#8b5e3c" }}>Create a character to star in your stories</p>
          <Link href="/characters/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #7bc8a4, #a8dbc4)" }}>
            <Plus className="w-4 h-4" /> Create First Character
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}
    </div>
  )
}
