"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Sparkles, ChevronRight, ChevronLeft, Wand2, BookOpen } from "lucide-react"

const THEMES = [
  { value: "adventure", emoji: "🗺️", label: "Adventure", desc: "Exploring new places" },
  { value: "friendship", emoji: "🤝", label: "Friendship", desc: "Making new friends" },
  { value: "courage", emoji: "🦁", label: "Courage", desc: "Being brave and bold" },
  { value: "kindness", emoji: "💝", label: "Kindness", desc: "Helping others" },
  { value: "creativity", emoji: "🎨", label: "Creativity", desc: "Imagining and creating" },
  { value: "nature", emoji: "🌿", label: "Nature", desc: "Animals and the outdoors" },
  { value: "magic", emoji: "✨", label: "Magic", desc: "Spells and wonders" },
  { value: "family", emoji: "👨‍👩‍👧", label: "Family", desc: "Love and belonging" },
]

const SETTINGS = [
  { value: "enchanted forest", emoji: "🌲", label: "Enchanted Forest" },
  { value: "underwater kingdom", emoji: "🐠", label: "Underwater Kingdom" },
  { value: "cozy village", emoji: "🏘️", label: "Cozy Village" },
  { value: "space adventure", emoji: "🚀", label: "Space Adventure" },
  { value: "magical castle", emoji: "🏰", label: "Magical Castle" },
  { value: "candy land", emoji: "🍭", label: "Candy Land" },
  { value: "cloud kingdom", emoji: "☁️", label: "Cloud Kingdom" },
  { value: "dinosaur world", emoji: "🦕", label: "Dinosaur World" },
]

const MORALS = [
  { value: "be yourself", emoji: "🌟", label: "Be Yourself", desc: "You're perfect just as you are" },
  { value: "never give up", emoji: "💪", label: "Never Give Up", desc: "Keep trying, you can do it!" },
  { value: "kindness matters", emoji: "💖", label: "Kindness Matters", desc: "A smile can change everything" },
  { value: "sharing is caring", emoji: "🤲", label: "Sharing is Caring", desc: "Things are better together" },
  { value: "be brave", emoji: "🦁", label: "Be Brave", desc: "Courage comes from within" },
  { value: "love your family", emoji: "👨‍👩‍👧", label: "Love Your Family", desc: "Family is our greatest treasure" },
  { value: "protect nature", emoji: "🌍", label: "Protect Nature", desc: "Take care of our beautiful world" },
  { value: "friendship is magic", emoji: "🌈", label: "Friendship is Magic", desc: "True friends make life beautiful" },
]

const STEPS = [
  { id: 1, title: "Choose Character", emoji: "🧒" },
  { id: 2, title: "Pick a Theme", emoji: "🎭" },
  { id: 3, title: "Choose Setting", emoji: "🗺️" },
  { id: 4, title: "Life Lesson", emoji: "💡" },
  { id: 5, title: "Final Touches", emoji: "✨" },
]

interface Character {
  id: string
  name: string
  age: number
  gender: string
  personality: string
  hobbies: string
}

function CreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCharacterId = searchParams.get("characterId")

  const [step, setStep] = useState(preselectedCharacterId ? 2 : 1)
  const [characters, setCharacters] = useState<Character[]>([])
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({
    characterId: preselectedCharacterId ?? "",
    theme: "",
    setting: "",
    moral: "",
    additionalDetails: "",
  })

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then(setCharacters)
      .catch(() => {})
  }, [])

  const selectedCharacter = characters.find((c) => c.id === form.characterId)
  const progress = (step / STEPS.length) * 100

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const book = await res.json()
      if (book.id) {
        router.push(`/books/${book.id}`)
      }
    } catch {
      setGenerating(false)
    }
  }

  if (generating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fdf8f0, #fce4ec)" }}>
        <div className="text-center max-w-md px-4">
          <div className="text-8xl mb-6 float-animation">✨</div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
            Creating Your Story...
          </h2>
          <p className="text-lg mb-6" style={{ color: "#8b5e3c" }}>
            Claude is writing a magical story just for {selectedCharacter?.name ?? "your child"}...
            This takes about 1-2 minutes. ☕
          </p>
          <div className="flex justify-center gap-2">
            {["📚", "🎨", "✨", "🌟", "🦋"].map((emoji, i) => (
              <span key={i} className="text-2xl float-animation" style={{ animationDelay: `${i * 0.3}s` }}>{emoji}</span>
            ))}
          </div>
          <div className="mt-8 w-full rounded-full h-3" style={{ background: "#f0e6d3" }}>
            <div className="h-full rounded-full loading-shimmer" style={{ width: "60%" }} />
          </div>
          <p className="text-xs mt-3" style={{ color: "#aaa" }}>
            Writing story → Generating illustrations → Crafting your book
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "linear-gradient(135deg, #fdf8f0, #e3f2fd)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-sm font-medium mb-4 inline-block" style={{ color: "#8b5e3c" }}>
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
            Create a New Book 📚
          </h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all`}
                  style={step >= s.id
                    ? { background: "linear-gradient(135deg, #e8834a, #f5a876)", color: "white" }
                    : { background: "white", border: "2px solid #f0e6d3", color: "#aaa" }}>
                  {s.emoji}
                </div>
                <span className="text-xs font-medium hidden md:block" style={{ color: step >= s.id ? "#e8834a" : "#aaa" }}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "#f0e6d3" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #e8834a, #f7c948)" }} />
          </div>
        </div>

        <div className="rounded-3xl p-8 shadow-lg" style={{ background: "white" }}>
          {/* Step 1: Character */}
          {step === 1 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold mb-4" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                🧒 Who is the star of this story?
              </h2>

              {characters.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🧒</div>
                  <p className="text-sm mb-4" style={{ color: "#8b5e3c" }}>You haven't created any characters yet!</p>
                  <Link href="/characters/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, #7bc8a4, #a8dbc4)" }}>
                    Create Your First Character
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {characters.map((char) => (
                    <button key={char.id} onClick={() => setForm({ ...form, characterId: char.id })}
                      className="p-4 rounded-2xl text-left transition-all hover:scale-105"
                      style={{
                        border: `2px solid ${form.characterId === char.id ? "#e8834a" : "#f0e6d3"}`,
                        background: form.characterId === char.id ? "rgba(232, 131, 74, 0.08)" : "white",
                      }}>
                      <div className="text-3xl mb-2">{char.gender === "girl" ? "👧" : char.gender === "boy" ? "👦" : "🧒"}</div>
                      <div className="font-bold text-sm" style={{ color: "#3d2b1f" }}>{char.name}</div>
                      <div className="text-xs" style={{ color: "#8b5e3c" }}>{char.age} years old</div>
                    </button>
                  ))}
                </div>
              )}

              <Link href="/characters/new" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: "#e8834a" }}>
                + Create a new character
              </Link>
            </div>
          )}

          {/* Step 2: Theme */}
          {step === 2 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                🎭 What's the story about?
              </h2>
              <p className="text-sm mb-5" style={{ color: "#8b5e3c" }}>Choose the main theme</p>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((theme) => (
                  <button key={theme.value} onClick={() => setForm({ ...form, theme: theme.value })}
                    className="p-4 rounded-2xl text-left transition-all hover:scale-105"
                    style={{
                      border: `2px solid ${form.theme === theme.value ? "#e8834a" : "#f0e6d3"}`,
                      background: form.theme === theme.value ? "rgba(232, 131, 74, 0.08)" : "white",
                    }}>
                    <span className="text-2xl">{theme.emoji}</span>
                    <div className="font-bold text-sm mt-1" style={{ color: "#3d2b1f" }}>{theme.label}</div>
                    <div className="text-xs" style={{ color: "#8b5e3c" }}>{theme.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Setting */}
          {step === 3 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                🗺️ Where does the story take place?
              </h2>
              <p className="text-sm mb-5" style={{ color: "#8b5e3c" }}>Pick a magical setting</p>
              <div className="grid grid-cols-2 gap-3">
                {SETTINGS.map((setting) => (
                  <button key={setting.value} onClick={() => setForm({ ...form, setting: setting.value })}
                    className="p-4 rounded-2xl text-center transition-all hover:scale-105"
                    style={{
                      border: `2px solid ${form.setting === setting.value ? "#e8834a" : "#f0e6d3"}`,
                      background: form.setting === setting.value ? "rgba(232, 131, 74, 0.08)" : "white",
                    }}>
                    <div className="text-3xl mb-1">{setting.emoji}</div>
                    <div className="text-sm font-bold" style={{ color: "#3d2b1f" }}>{setting.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Moral */}
          {step === 4 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                💡 What lesson should the story teach?
              </h2>
              <p className="text-sm mb-5" style={{ color: "#8b5e3c" }}>Every great story has a meaningful lesson</p>
              <div className="grid grid-cols-2 gap-3">
                {MORALS.map((moral) => (
                  <button key={moral.value} onClick={() => setForm({ ...form, moral: moral.value })}
                    className="p-4 rounded-2xl text-left transition-all hover:scale-105"
                    style={{
                      border: `2px solid ${form.moral === moral.value ? "#e8834a" : "#f0e6d3"}`,
                      background: form.moral === moral.value ? "rgba(232, 131, 74, 0.08)" : "white",
                    }}>
                    <span className="text-2xl">{moral.emoji}</span>
                    <div className="font-bold text-sm mt-1" style={{ color: "#3d2b1f" }}>{moral.label}</div>
                    <div className="text-xs" style={{ color: "#8b5e3c" }}>{moral.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Final details */}
          {step === 5 && (
            <div className="fade-in space-y-6">
              <h2 className="text-xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                ✨ Almost there! Final touches
              </h2>

              {/* Summary */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "#fdf8f0", border: "2px solid #f0e6d3" }}>
                <div className="text-sm font-bold mb-3" style={{ color: "#3d2b1f" }}>Your story summary:</div>
                {selectedCharacter && <div className="text-sm">🧒 Starring: <strong>{selectedCharacter.name}</strong></div>}
                <div className="text-sm">🎭 Theme: <strong>{form.theme}</strong></div>
                <div className="text-sm">🗺️ Setting: <strong>{form.setting}</strong></div>
                <div className="text-sm">💡 Lesson: <strong>{form.moral}</strong></div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#3d2b1f" }}>
                  Any special details? (optional)
                </label>
                <textarea value={form.additionalDetails}
                  onChange={(e) => setForm({ ...form, additionalDetails: e.target.value })}
                  placeholder="e.g., Emma's favorite stuffed animal is a bear named Ted. She loves going to the park with Grandma..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl outline-none resize-none"
                  style={{ border: "2px solid #f0e6d3", background: "#fdf8f0", color: "#3d2b1f", fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "#e8834a"}
                  onBlur={(e) => e.target.style.borderColor = "#f0e6d3"}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6" style={{ borderTop: "2px solid #f0e6d3" }}>
            <button onClick={() => setStep(step - 1)} disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-40"
              style={{ border: "2px solid #f0e6d3", color: "#8b5e3c" }}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length ? (
              <button onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !form.characterId) ||
                  (step === 2 && !form.theme) ||
                  (step === 3 && !form.setting) ||
                  (step === 4 && !form.moral)
                }
                className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleGenerate}
                className="flex items-center gap-3 px-8 py-3 rounded-full text-white font-bold text-base transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #e8834a, #f7c948)", boxShadow: "0 6px 20px rgba(232, 131, 74, 0.4)" }}>
                <Sparkles className="w-5 h-5" />
                Create My Book! ✨
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  )
}
