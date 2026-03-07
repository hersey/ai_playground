"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Sparkles, Check } from "lucide-react"

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    emoji: "🌱",
    features: ["1 character", "1 book total", "PDF download", "8 pages per book"],
    priceId: null,
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$9.99",
    period: "/month",
    emoji: "⭐",
    features: ["3 characters", "5 books/month", "PDF downloads", "10 pages per book", "Print-ready files"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
    highlighted: true,
  },
  {
    name: "Family",
    price: "$19.99",
    period: "/month",
    emoji: "👨‍👩‍👧‍👦",
    features: ["Unlimited characters", "Unlimited books", "PDF downloads", "12 pages per book", "Print-ready files", "Priority generation"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID,
    highlighted: false,
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(priceId: string | null | undefined) {
    if (!priceId) return
    setLoading(priceId)
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>
          📋 Subscription Plans
        </h1>
        <p style={{ color: "#8b5e3c" }}>Choose the plan that's right for your family</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {PLANS.map((plan) => (
          <div key={plan.name}
            className={`rounded-3xl p-8 relative transition-all hover:scale-105 ${plan.highlighted ? "ring-4 ring-orange-400" : ""}`}
            style={{
              background: plan.highlighted ? "linear-gradient(135deg, #e8834a, #f5a876)" : "white",
              boxShadow: plan.highlighted ? "0 12px 40px rgba(232, 131, 74, 0.4)" : "0 4px 20px rgba(0,0,0,0.08)",
            }}>
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
            )}

            <div className="text-4xl mb-3">{plan.emoji}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: plan.highlighted ? "white" : "#3d2b1f", fontFamily: "'Fredoka One', cursive" }}>{plan.name}</div>
            <div className="text-4xl font-black mb-1" style={{ color: plan.highlighted ? "white" : "#3d2b1f" }}>
              {plan.price}<span className="text-base font-normal opacity-70">{plan.period}</span>
            </div>

            <ul className="mt-6 space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: plan.highlighted ? "rgba(255,255,255,0.9)" : "#5a4a3a" }}>
                  <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-white" : "text-green-500"}`} />
                  {f}
                </li>
              ))}
            </ul>

            {plan.priceId ? (
              <button onClick={() => handleSubscribe(plan.priceId)}
                disabled={loading === plan.priceId}
                className={`w-full py-3 rounded-full font-bold text-sm transition-all hover:scale-105 ${plan.highlighted ? "bg-white text-orange-500" : "text-white"}`}
                style={!plan.highlighted ? { background: "linear-gradient(135deg, #e8834a, #f5a876)" } : {}}>
                {loading === plan.priceId ? "Redirecting..." : `Subscribe to ${plan.name}`}
              </button>
            ) : (
              <div className="w-full py-3 rounded-full text-center font-bold text-sm" style={{ background: "rgba(0,0,0,0.08)", color: plan.highlighted ? "white" : "#8b5e3c" }}>
                Current Plan (Free)
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-2xl" style={{ background: "rgba(232, 131, 74, 0.08)", border: "1.5px solid rgba(232, 131, 74, 0.2)" }}>
        <p className="text-sm" style={{ color: "#8b5e3c" }}>
          💳 Secure payments powered by Stripe. Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  )
}
