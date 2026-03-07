import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"

interface Page {
  pageNumber: number
  text: string
  imageUrl?: string
}

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const book = await prisma.book.findFirst({
    where: { id, userId: session.user.id },
    include: { character: true },
  })

  if (!book) notFound()

  const pages: Page[] = JSON.parse(book.pages || "[]")

  return (
    <html>
      <head>
        <title>{book.title} - Print</title>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Patrick+Hand&display=swap" rel="stylesheet" />
        <style>{`
          @page { size: 8.5in 8.5in; margin: 0.5in; }
          @media print { .no-print { display: none !important; } }
          body { font-family: 'Patrick Hand', cursive; background: #fdf8f0; margin: 0; }
          .book-page { page-break-after: always; display: flex; flex-direction: column; min-height: 7in; background: #fef9ee; border-radius: 16px; margin-bottom: 20px; overflow: hidden; }
          .book-page:last-child { page-break-after: auto; }
          .illustration { width: 100%; height: 5in; object-fit: cover; }
          .page-text { font-size: 18pt; line-height: 1.6; text-align: center; padding: 20px; color: #3d2b1f; }
          .cover { background: linear-gradient(135deg, #e8834a, #f7c948); min-height: 7in; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; padding: 40px; text-align: center; }
          .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #e8834a; color: white; border: none; border-radius: 50px; font-size: 16px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(232, 131, 74, 0.4); z-index: 100; }
          .page-num { text-align: center; color: #aaa; font-size: 10pt; padding: 8px; margin-top: auto; }
        `}</style>
      </head>
      <body>
        <button className="no-print print-btn" onClick={() => (window as any).print()}>
          🖨️ Print / Save as PDF
        </button>

        <div className="book-page">
          <div className="cover">
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📚</div>
            <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "36pt", margin: "0 0 16px" }}>
              {book.title}
            </h1>
            {book.character && (
              <p style={{ fontSize: "16pt", opacity: 0.85, fontStyle: "italic" }}>
                Starring {book.character.name}
              </p>
            )}
            <p style={{ fontSize: "12pt", opacity: 0.7, marginTop: "30px" }}>
              Created with ❤️ on StoryTime
            </p>
          </div>
        </div>

        {pages.map((page, i) => (
          <div key={i} className="book-page">
            {page.imageUrl && (
              <img src={page.imageUrl} alt={`Page ${i + 1}`} className="illustration" />
            )}
            <p className="page-text">{page.text}</p>
            <div className="page-num">{i + 1} / {pages.length}</div>
          </div>
        ))}

        <div className="book-page">
          <div className="cover">
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌟</div>
            <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "28pt", margin: "0 0 12px" }}>The End</h2>
            <p style={{ fontSize: "14pt", fontStyle: "italic", opacity: 0.85 }}>"{book.moral}"</p>
            <div style={{ marginTop: "30px", fontSize: "10pt", opacity: 0.6 }}>storytime.app</div>
          </div>
        </div>
      </body>
    </html>
  )
}
