import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Sparkles, BookOpen, Star, Heart, Palette, Printer, ChevronRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#fdf8f0" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-20 float-animation" style={{ background: "radial-gradient(circle, #f5a876, transparent)", animationDelay: "0s" }} />
        <div className="absolute top-40 right-10 w-48 h-48 rounded-full opacity-20 float-animation" style={{ background: "radial-gradient(circle, #7bc8a4, transparent)", animationDelay: "1s" }} />
        <div className="absolute bottom-10 left-1/3 w-32 h-32 rounded-full opacity-20 float-animation" style={{ background: "radial-gradient(circle, #f7c948, transparent)", animationDelay: "2s" }} />

        <div className="max-w-6xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ background: "rgba(232, 131, 74, 0.1)", color: "#e8834a", border: "1.5px solid rgba(232, 131, 74, 0.3)" }}>
            <Sparkles className="w-4 h-4" />
            AI-Powered Personalized Children's Books
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
            Your Child is the
            <span className="block" style={{ color: "#e8834a" }}>
              Hero of Every Story
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed" style={{ color: "#8b5e3c" }}>
            Create beautiful, hand-illustrated children's books starring your little one. 
            Tell their story with warmth, love, and a touch of magic. ✨
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/signup" className="flex items-center gap-3 px-8 py-4 rounded-full text-white text-lg font-bold transition-all hover:scale-105 shadow-xl" style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)", boxShadow: "0 8px 30px rgba(232, 131, 74, 0.4)" }}>
              <Sparkles className="w-5 h-5" />
              Create Your First Book Free
            </Link>
            <Link href="/#how-it-works" className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105" style={{ border: "2px solid #e8834a", color: "#e8834a" }}>
              See How It Works
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Hero Image - Book Preview Mockup */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {/* Book preview cards */}
              {[
                { emoji: "🌟", title: "The Brave Explorer", color: "#fef3e2", borderColor: "#f5a876" },
                { emoji: "🌈", title: "Rainbow Dreams", color: "#e8f5e9", borderColor: "#7bc8a4", className: "translate-y-4" },
                { emoji: "🦋", title: "Garden of Wonders", color: "#fce4ec", borderColor: "#f4a0b5" },
              ].map((book, i) => (
                <div key={i} className={`book-card rounded-2xl p-6 text-center ${book.className || ""}`} style={{ background: book.color, border: `2px solid ${book.borderColor}` }}>
                  <div className="text-5xl mb-3">{book.emoji}</div>
                  <div className="text-sm font-bold" style={{ color: "#3d2b1f" }}>{book.title}</div>
                  <div className="mt-2 flex justify-center gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-current" style={{ color: "#f7c948" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 text-4xl float-animation" style={{ animationDelay: "0.5s" }}>⭐</div>
            <div className="absolute -bottom-4 -right-4 text-4xl float-animation" style={{ animationDelay: "1.5s" }}>🌙</div>
          </div>
        </div>
      </section>

      {/* Wavy divider */}
      <div className="wavy-divider" style={{ marginTop: "-2px" }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" fill="#e8f5e9">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>

      {/* Features */}
      <section className="py-20 px-4" style={{ background: "#e8f5e9" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
              Why Families Love StoryTime
            </h2>
            <p className="text-lg" style={{ color: "#5a7c5a" }}>
              Everything you need to create a book your child will treasure forever
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "👧",
                title: "Your Child is the Star",
                description: "Create a unique character based on your child — their looks, personality, hobbies, and even their pet! Every book is uniquely theirs.",
                color: "#fef3e2",
                accent: "#e8834a",
              },
              {
                icon: "🎨",
                title: "Warm, Hand-Illustrated Style",
                description: "Our AI generates beautiful watercolor-style illustrations with warm, cozy tones — like a classic children's book painted just for your family.",
                color: "#fce4ec",
                accent: "#e91e8c",
              },
              {
                icon: "✨",
                title: "AI-Powered Storytelling",
                description: "Claude AI crafts original, engaging stories tailored to your child's age, interests, and the lesson you want to share.",
                color: "#e3f2fd",
                accent: "#1976d2",
              },
              {
                icon: "📖",
                title: "Reusable Characters",
                description: "Create your child's character once and use them in unlimited new adventures. Watch them grow across a whole library of stories!",
                color: "#e8f5e9",
                accent: "#388e3c",
              },
              {
                icon: "🖨️",
                title: "Print-Quality Output",
                description: "Download your book as a high-resolution PDF ready for professional printing services like Lulu or Blurb. A real book in your hands!",
                color: "#fff3e0",
                accent: "#f57c00",
              },
              {
                icon: "🔐",
                title: "Your Books, Always Safe",
                description: "All your stories are securely stored in the cloud. Access, edit, and re-download your precious family books anytime.",
                color: "#f3e5f5",
                accent: "#7b1fa2",
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-3xl p-6 transition-all hover:scale-105" style={{ background: feature.color, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#3d2b1f" }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#5a4a3a" }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wavy divider */}
      <div className="wavy-divider">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" fill="#e8f5e9">
          <path d="M0,30 C360,0 720,60 1080,30 C1260,15 1380,40 1440,30 L1440,0 L0,0 Z" />
        </svg>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4" style={{ background: "#fdf8f0" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
              Three Simple Steps
            </h2>
            <p className="text-lg" style={{ color: "#8b5e3c" }}>From idea to printed book in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5" style={{ background: "linear-gradient(90deg, #e8834a, #f7c948)" }} />

            {[
              { step: "1", emoji: "🎭", title: "Create Your Character", desc: "Build your child's character with their name, looks, personality, hobbies, and more. Save it to reuse in future books!" },
              { step: "2", emoji: "🌟", title: "Choose Your Story", desc: "Pick a theme, setting, and the lesson you want your child to learn. Answer fun questions to guide the story." },
              { step: "3", emoji: "📚", title: "Get Your Book", desc: "Our AI writes a beautiful story and generates warm illustrations. Download as a PDF or order a printed copy!" },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 relative z-10" style={{ background: "linear-gradient(135deg, #e8834a, #f7c948)", boxShadow: "0 4px 15px rgba(232, 131, 74, 0.4)" }}>
                  {step.step}
                </div>
                <div className="text-4xl mb-4">{step.emoji}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8b5e3c" }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/signup" className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white text-lg font-bold hover:scale-105 transition-transform" style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)", boxShadow: "0 8px 25px rgba(232, 131, 74, 0.35)" }}>
              <BookOpen className="w-5 h-5" />
              Start Creating Now
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4" style={{ background: "#fef3e2" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
              Simple, Honest Pricing
            </h2>
            <p className="text-lg" style={{ color: "#8b5e3c" }}>Start free, upgrade when you're ready</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                emoji: "🌱",
                features: ["1 character", "1 book", "PDF download", "8 pages per book"],
                cta: "Start Free",
                href: "/signup",
                highlighted: false,
              },
              {
                name: "Starter",
                price: "$9.99",
                period: "/month",
                emoji: "⭐",
                features: ["3 characters", "5 books/month", "PDF downloads", "10 pages per book", "Print-ready files"],
                cta: "Start Starter",
                href: "/signup?plan=starter",
                highlighted: true,
              },
              {
                name: "Family",
                price: "$19.99",
                period: "/month",
                emoji: "👨‍👩‍👧‍👦",
                features: ["Unlimited characters", "Unlimited books", "PDF downloads", "12 pages per book", "Print-ready files", "Priority generation"],
                cta: "Start Family",
                href: "/signup?plan=family",
                highlighted: false,
              },
            ].map((plan, i) => (
              <div key={i} className="rounded-3xl p-8 relative transition-all hover:scale-105"
                style={{
                  background: plan.highlighted ? "linear-gradient(135deg, #e8834a, #f5a876)" : "white",
                  color: plan.highlighted ? "white" : "#3d2b1f",
                  boxShadow: plan.highlighted ? "0 12px 40px rgba(232, 131, 74, 0.4), 0 0 0 4px #e8834a" : "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-4xl mb-4">{plan.emoji}</div>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: "'Fredoka One', cursive" }}>{plan.name}</div>
                <div className="text-4xl font-black mb-1">{plan.price}<span className="text-base font-normal opacity-70">{plan.period}</span></div>
                <ul className="mt-6 space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <span className={plan.highlighted ? "text-white" : "text-green-500"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block w-full text-center px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 ${plan.highlighted ? "bg-white text-orange-500" : "text-white"}`}
                  style={!plan.highlighted ? { background: "linear-gradient(135deg, #e8834a, #f5a876)" } : {}}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4" style={{ background: "#fdf8f0" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
              Families Are Smiling 😊
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "My daughter cried happy tears when she saw herself as the princess in her own book. Best gift ever!", name: "Sarah M.", role: "Mom of 2", emoji: "💖" },
              { quote: "We created 5 books for our son's birthday party. Every kid got a personalized story — absolutely magical!", name: "James K.", role: "Dad of 3", emoji: "🎉" },
              { quote: "The illustrations are so warm and beautiful! It looks like a real published children's book.", name: "Maria L.", role: "Grandma & storyteller", emoji: "📚" },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div className="text-3xl mb-4">{t.emoji}</div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: "#5a4a3a" }}>"{t.quote}"</p>
                <div>
                  <div className="font-bold text-sm" style={{ color: "#3d2b1f" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: "#8b5e3c" }}>{t.role}</div>
                </div>
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: "#f7c948" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center" style={{ background: "linear-gradient(135deg, #e8834a, #f5a876)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-6xl mb-6">🌟</div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "'Fredoka One', cursive" }}>
            Start Your First Story Today
          </h2>
          <p className="text-lg text-white opacity-90 mb-10">
            Free to start. No credit card needed. Create a book your child will remember forever.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-xl font-bold hover:scale-105 transition-transform" style={{ color: "#e8834a", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
            <Sparkles className="w-6 h-6" />
            Create My First Book — It's Free!
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 text-center" style={{ background: "#3d2b1f", color: "rgba(255,255,255,0.6)" }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">📚</span>
          <span className="text-xl font-bold text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>StoryTime</span>
        </div>
        <p className="text-sm mb-4">Made with ❤️ for families who love stories</p>
        <div className="flex justify-center gap-6 text-sm">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <p className="text-xs mt-4 opacity-50">© 2024 StoryTime. All rights reserved.</p>
      </footer>
    </div>
  )
}
