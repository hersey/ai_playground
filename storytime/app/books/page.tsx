import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BookCard } from "@/components/book-card"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default async function BooksPage() {
  const session = await getServerSession(authOptions)

  const books = await prisma.book.findMany({
    where: { userId: session!.user.id },
    include: { character: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
          📚 My Books
        </h1>
        <Link href="/create" className="flex items-center gap-2 px-5 py-2 rounded-full text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
          <Sparkles className="w-4 h-4" /> New Book
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "white", border: "2px dashed #f0e6d3" }}>
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f" }}>No books yet!</h3>
          <p className="text-sm mb-6" style={{ color: "#8b5e3c" }}>Create your first magical story</p>
          <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
            <Sparkles className="w-4 h-4" /> Create My First Book
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}
