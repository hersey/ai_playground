import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BookOpen, Users, Sparkles, Plus } from "lucide-react"
import { BookCard } from "@/components/book-card"
import { CharacterCard } from "@/components/character-card"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)!

  const [books, characters] = await Promise.all([
    prisma.book.findMany({
      where: { userId: session!.user.id },
      include: { character: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.character.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ])

  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="py-8">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
          Hi, {firstName}! 👋
        </h1>
        <p className="text-lg" style={{ color: "#8b5e3c" }}>
          Ready to create another magical story?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <Link href="/create" className="group flex items-center gap-4 p-6 rounded-3xl transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)", boxShadow: "0 8px 25px rgba(232, 131, 74, 0.3)" }}>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl">📚</div>
          <div className="text-white">
            <div className="font-bold text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>Create a Book</div>
            <div className="text-sm opacity-80">Start a new story adventure</div>
          </div>
          <Sparkles className="ml-auto text-white opacity-70 w-6 h-6" />
        </Link>

        <Link href="/characters/new" className="group flex items-center gap-4 p-6 rounded-3xl transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #7bc8a4, #a8dbc4)", boxShadow: "0 8px 25px rgba(123, 200, 164, 0.3)" }}>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl">🧒</div>
          <div className="text-white">
            <div className="font-bold text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>New Character</div>
            <div className="text-sm opacity-80">Create your child's character</div>
          </div>
          <Plus className="ml-auto text-white opacity-70 w-6 h-6" />
        </Link>
      </div>

      {/* Characters */}
      {characters.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
              🧒 Your Characters
            </h2>
            <Link href="/characters" className="text-sm font-semibold hover:underline" style={{ color: "#e8834a" }}>
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Books */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
            📚 Your Books
          </h2>
          {books.length > 0 && (
            <Link href="/books" className="text-sm font-semibold hover:underline" style={{ color: "#e8834a" }}>
              View all →
            </Link>
          )}
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16 rounded-3xl" style={{ background: "white", border: "2px dashed #f0e6d3" }}>
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
              No books yet!
            </h3>
            <p className="text-sm mb-6" style={{ color: "#8b5e3c" }}>
              Create your first magical story
            </p>
            <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
              <Sparkles className="w-4 h-4" />
              Create My First Book
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
