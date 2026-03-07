"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react"
import Link from "next/link"

const STEPS = [
  { id: 1, title: "Basic Info", emoji: "👤" },
  { id: 2, title: "Appearance", emoji: "🎨" },
  { id: 3, title: "Personality", emoji: "✨" },
  { id: 4, title: "Hobbies & Pet", emoji: "🎮" },
]

const HAIR_COLORS = ["Blonde", "Light Brown", "Dark Brown", "Black", "Red", "Auburn", "Strawberry Blonde"]
const HAIR_STYLES = ["Straight", "Wavy", "Curly", "Braids", "Pigtails", "Short", "Long", "Afro puffs", "Bob"]
const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Dark Brown"]
const SKIN_TONES = ["Very Light", "Light", "Light Medium", "Medium", "Medium Brown", "Dark Brown", "Deep"]
const PERSONALITIES = ["Brave", "Kind", "Funny", "Curious", "Creative", "Adventurous", "Caring", "Smart", "Energetic", "Shy", "Thoughtful", "Silly", "Gentle", "Determined", "Imaginative"]
const HOBBIES = ["Drawing", "Dancing", "Singing", "Reading", "Sports", "Cooking", "Building", "Animals", "Music", "Science", "Gardening", "Photography", "Puzzles", "Theater", "Swimming", "Hiking"]
const PETS = ["Dog", "Cat", "Bunny", "Fish", "Bird", "Hamster", "Turtle", "Horse", "Dragon (pretend!)", "Unicorn (pretend!)"]

export default function NewCharacterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    age: 5,
    gender: "girl",
    hairColor: "Brown",
    hairStyle: "Wavy",
    eyeColor: "Brown",
    skinTone: "Medium",
    personality: [] as string[],
    hobbies: [] as string[],
    petName: "",
    petType: "",
    hasPet: false,
  })

  function toggle<T>(arr: T[], val: T, max = 4): T[] {
    if (arr.includes(val)) return arr.filter((x) => x !== val)
    if (arr.length >= max) return arr
    return [...arr, val]
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          avatarDescription: `A ${form.age}-year-old ${form.gender} with ${form.hairColor.toLowerCase()} ${form.hairStyle.toLowerCase()} hair and ${form.eyeColor.toLowerCase()} eyes`,
        }),
      })
      const character = await res.json()
      router.push(`/create?characterId=${character.id}`)
    } catch {
      setSaving(false)
    }
  }

  const progress = (step / STEPS.length) * 100

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "linear-gradient(135deg, #fdf8f0, #e8f5e9)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-sm font-medium mb-4 inline-block" style={{ color: "#8b5e3c" }}>
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
            Create Your Character 🧒
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8b5e3c" }}>
            Build the hero of your stories!
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${step >= s.id ? "text-white" : "bg-white text-gray-400"}`}
                  style={step >= s.id ? { background: "linear-gradient(135deg, #e8834a, #f5a876)" } : { border: "2px solid #f0e6d3" }}>
                  {step > s.id ? <Check className="w-5 h-5" /> : s.emoji}
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

        {/* Card */}
        <div className="rounded-3xl p-8 shadow-lg" style={{ background: "white" }}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 fade-in">
              <h2 className="text-xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                👤 Tell us about your character!
              </h2>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#3d2b1f" }}>What's their name?</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Emma, Noah, Lily..."
                  className="w-full px-4 py-3 rounded-xl outline-none text-lg"
                  style={{ border: "2px solid #f0e6d3", background: "#fdf8f0", color: "#3d2b1f", fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "#e8834a"}
                  onBlur={(e) => e.target.style.borderColor = "#f0e6d3"}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#3d2b1f" }}>How old are they?</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={2} max={12} value={form.age}
                    onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) })}
                    className="flex-1" style={{ accentColor: "#e8834a" }}
                  />
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
                    {form.age}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3" style={{ color: "#3d2b1f" }}>Are they a...?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "girl", emoji: "👧", label: "Girl" },
                    { value: "boy", emoji: "👦", label: "Boy" },
                    { value: "child", emoji: "🧒", label: "My Child" },
                  ].map((g) => (
                    <button key={g.value} onClick={() => setForm({ ...form, gender: g.value })}
                      className="p-4 rounded-2xl text-center transition-all hover:scale-105"
                      style={{
                        border: `2px solid ${form.gender === g.value ? "#e8834a" : "#f0e6d3"}`,
                        background: form.gender === g.value ? "rgba(232, 131, 74, 0.1)" : "white",
                      }}>
                      <div className="text-3xl mb-1">{g.emoji}</div>
                      <div className="text-sm font-bold" style={{ color: form.gender === g.value ? "#e8834a" : "#3d2b1f" }}>{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Appearance */}
          {step === 2 && (
            <div className="space-y-6 fade-in">
              <h2 className="text-xl font-bold" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                🎨 What do they look like?
              </h2>

              {[
                { label: "Hair Color", key: "hairColor", options: HAIR_COLORS },
                { label: "Hair Style", key: "hairStyle", options: HAIR_STYLES },
                { label: "Eye Color", key: "eyeColor", options: EYE_COLORS },
                { label: "Skin Tone", key: "skinTone", options: SKIN_TONES },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-sm font-bold mb-2" style={{ color: "#3d2b1f" }}>{label}</label>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                      <button key={opt} onClick={() => setForm({ ...form, [key]: opt })}
                        className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                        style={{
                          border: `2px solid ${(form as any)[key] === opt ? "#e8834a" : "#f0e6d3"}`,
                          background: (form as any)[key] === opt ? "rgba(232, 131, 74, 0.1)" : "white",
                          color: (form as any)[key] === opt ? "#e8834a" : "#5a4a3a",
                        }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Personality */}
          {step === 3 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                ✨ What's {form.name || "their"} personality like?
              </h2>
              <p className="text-sm mb-5" style={{ color: "#8b5e3c" }}>Pick up to 4 traits that describe them best</p>
              <div className="flex flex-wrap gap-2">
                {PERSONALITIES.map((trait) => {
                  const selected = form.personality.includes(trait)
                  return (
                    <button key={trait} onClick={() => setForm({ ...form, personality: toggle(form.personality, trait) })}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                      style={{
                        background: selected ? "linear-gradient(135deg, #e8834a, #f5a876)" : "white",
                        color: selected ? "white" : "#5a4a3a",
                        border: `2px solid ${selected ? "#e8834a" : "#f0e6d3"}`,
                      }}>
                      {trait}
                    </button>
                  )
                })}
              </div>
              {form.personality.length > 0 && (
                <p className="text-sm mt-4 font-medium" style={{ color: "#e8834a" }}>
                  Selected: {form.personality.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Hobbies & Pet */}
          {step === 4 && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
                  🎮 What does {form.name || "your character"} love to do?
                </h2>
                <p className="text-sm mb-4" style={{ color: "#8b5e3c" }}>Pick their favorite hobbies (up to 4)</p>
                <div className="flex flex-wrap gap-2">
                  {HOBBIES.map((hobby) => {
                    const selected = form.hobbies.includes(hobby)
                    return (
                      <button key={hobby} onClick={() => setForm({ ...form, hobbies: toggle(form.hobbies, hobby) })}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                        style={{
                          background: selected ? "linear-gradient(135deg, #7bc8a4, #a8dbc4)" : "white",
                          color: selected ? "white" : "#5a4a3a",
                          border: `2px solid ${selected ? "#7bc8a4" : "#f0e6d3"}`,
                        }}>
                        {hobby}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="checkbox" id="hasPet" checked={form.hasPet}
                    onChange={(e) => setForm({ ...form, hasPet: e.target.checked, petName: "", petType: "" })}
                    className="w-5 h-5 rounded" style={{ accentColor: "#e8834a" }} />
                  <label htmlFor="hasPet" className="font-bold" style={{ color: "#3d2b1f" }}>
                    🐾 Do they have a pet?
                  </label>
                </div>
                {form.hasPet && (
                  <div className="pl-8 space-y-3 fade-in">
                    <div>
                      <label className="block text-sm font-bold mb-1" style={{ color: "#3d2b1f" }}>Pet's name</label>
                      <input type="text" value={form.petName} onChange={(e) => setForm({ ...form, petName: e.target.value })}
                        placeholder="Fluffy, Max, Daisy..."
                        className="w-full px-4 py-2 rounded-xl outline-none"
                        style={{ border: "2px solid #f0e6d3", background: "#fdf8f0", color: "#3d2b1f", fontFamily: "inherit" }}
                        onFocus={(e) => e.target.style.borderColor = "#e8834a"}
                        onBlur={(e) => e.target.style.borderColor = "#f0e6d3"}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PETS.map((pet) => (
                        <button key={pet} onClick={() => setForm({ ...form, petType: pet })}
                          className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                          style={{
                            border: `2px solid ${form.petType === pet ? "#e8834a" : "#f0e6d3"}`,
                            background: form.petType === pet ? "rgba(232, 131, 74, 0.1)" : "white",
                            color: form.petType === pet ? "#e8834a" : "#5a4a3a",
                          }}>
                          {pet}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
              <button onClick={() => setStep(step + 1)} disabled={step === 1 && !form.name}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || form.personality.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7bc8a4, #a8dbc4)" }}>
                <Sparkles className="w-4 h-4" />
                {saving ? "Saving..." : "Save & Create Book!"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
