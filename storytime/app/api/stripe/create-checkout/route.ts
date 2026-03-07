import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { absoluteUrl } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { priceId } = await req.json()

  const billingUrl = absoluteUrl("/dashboard/billing")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // If user already has a subscription, redirect to billing portal
  if (user.stripeSubscriptionId) {
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId!,
      return_url: billingUrl,
    })
    return NextResponse.json({ url: stripeSession.url })
  }

  const stripeSession = await stripe.checkout.sessions.create({
    success_url: `${billingUrl}?success=true`,
    cancel_url: `${billingUrl}?canceled=true`,
    payment_method_types: ["card"],
    mode: "subscription",
    billing_address_collection: "auto",
    customer_email: user.email!,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: session.user.id },
  })

  return NextResponse.json({ url: stripeSession.url })
}
