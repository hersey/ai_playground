"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Download, Sparkles, ChevronLeft, ChevronRight, BookOpen, Printer } from "lucide-react"

interface Page {
  pageNumber: number
  text: string
  imagePrompt: string
  imageUrl?: string
}

interface Book {
  id: string
  title: string
  theme: string
  setting: string
  moral: string
  pages: string
  status: string
  pageCount: number
  coverUrl?: string
  character?: { name: string; age: number } | null
}

export default function BookViewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [book, setBook] = useState<Book | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"reading" | "all">("reading")

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBook(data)
        setPages(JSON.parse(data.pages || "[]"))
        setLoading(false)
      })
      .catch(() => {
        router.push("/dashboard")
      })
  }, [id])

  async function handleDownloadPDF() {
    // Open print view
    window.open(`/books/${id}/print`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fdf8f0" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 float-animation">📚</div>
          <p style={{ color: "#8b5e3c" }}>Loading your story...</p>
        </div>
      </div>
    )
  }

  if (!book) return null

  const totalPages = pages.length
  const currentPageData = pages[currentPage]

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #fdf8f0, #fce4ec)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3" style={{ background: "rgba(253, 248, 240, 0.95)", backdropFilter: "blur(10px)", borderBottom: "2px solid rgba(232, 131, 74, 0.15)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#8b5e3c" }}>
            <ChevronLeft className="w-4 h-4" /> My Books
          </Link>

          <h1 className="text-lg font-bold text-center flex-1 mx-4 truncate" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
            {book.title}
          </h1>

          <div className="flex items-center gap-2">
            <button onClick={handleDownloadPDF}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-white text-sm font-bold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* View mode toggle */}
        <div className="flex gap-2 mb-6 justify-center">
          {[{ id: "reading", label: "📖 Story View" }, { id: "all", label: "📄 All Pages" }].map((mode) => (
            <button key={mode.id} onClick={() => setViewMode(mode.id as any)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: viewMode === mode.id ? "linear-gradient(135deg, #e8834a, #f5a876)" : "white",
                color: viewMode === mode.id ? "white" : "#8b5e3c",
                border: `2px solid ${viewMode === mode.id ? "#e8834a" : "#f0e6d3"}`,
              }}>
              {mode.label}
            </button>
          ))}
        </div>

        {/* Reading Mode */}
        {viewMode === "reading" && currentPageData && (
          <div className="fade-in">
            {/* Book page */}
            <div className="story-page max-w-lg mx-auto overflow-hidden rounded-3xl shadow-2xl"
              style={{ boxShadow: "0 20px 60px rgba(61, 43, 31, 0.2)" }}>
              {/* Illustration */}
              <div className="aspect-square w-full relative" style={{ background: "linear-gradient(135deg, #fef3e2, #fce4ec)" }}>
                {currentPageData.imageUrl ? (
                  <img src={currentPageData.imageUrl} alt={`Page ${currentPage + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">🎨</div>
                      <p className="text-sm" style={{ color: "#8b5e3c" }}>Illustration loading...</p>
                    </div>
                  </div>
                )}
                {/* Page number badge */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(253, 248, 240, 0.9)", color: "#8b5e3c" }}>
                  {currentPage + 1}
                </div>
              </div>

              {/* Text */}
              <div className="p-6" style={{ background: "#fef9ee" }}>
                <p className="text-lg leading-relaxed text-center" style={{ color: "#3d2b1f", fontFamily: "'Patrick Hand', cursive", fontSize: "1.1rem" }}>
                  {currentPageData.text}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 max-w-lg mx-auto">
              <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-30"
                style={{ border: "2px solid #f0e6d3", color: "#8b5e3c", background: "white" }}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              <div className="flex gap-1">
                {pages.map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i)}
                    className="w-2.5 h-2.5 rounded-full transition-all"
                    style={{ background: i === currentPage ? "#e8834a" : "#f0e6d3", transform: i === currentPage ? "scale(1.3)" : "scale(1)" }}
                  />
                ))}
              </div>

              <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1}
                className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-30"
                style={{ border: "2px solid #f0e6d3", color: "#8b5e3c", background: "white" }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {currentPage === totalPages - 1 && (
              <div className="text-center mt-8 p-6 rounded-3xl fade-in" style={{ background: "linear-gradient(135deg, #fef3e2, #e8f5e9)" }}>
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>The End!</h3>
                <p className="text-sm mb-4" style={{ color: "#8b5e3c" }}>Lesson: <em>{book.moral}</em></p>
                <div className="flex justify-center gap-3">
                  <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
                    <Printer className="w-4 h-4" /> Print Book
                  </button>
                  <Link href="/create" className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold"
                    style={{ border: "2px solid #e8834a", color: "#e8834a" }}>
                    <Sparkles className="w-4 h-4" /> New Story
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Pages Mode */}
        {viewMode === "all" && (
          <div className="grid md:grid-cols-2 gap-6 fade-in">
            {pages.map((page, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-md" style={{ background: "white", border: "2px solid #f0e6d3" }}>
                <div className="aspect-video relative" style={{ background: "linear-gradient(135deg, #fef3e2, #fce4ec)" }}>
                  {page.imageUrl ? (
                    <img src={page.imageUrl} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎨</div>
                  )}
                  <div className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: "rgba(253, 248, 240, 0.9)", color: "#8b5e3c" }}>
                    Page {i + 1}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm leading-relaxed" style={{ color: "#3d2b1f", fontFamily: "'Patrick Hand', cursive" }}>
                    {page.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
