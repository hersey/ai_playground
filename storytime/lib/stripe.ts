import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
})

export const PLANS = {
  FREE: {
    name: "Free",
    slug: "free",
    books: 1,
    characters: 1,
    price: 0,
  },
  STARTER: {
    name: "Starter",
    slug: "starter",
    books: 5,
    characters: 3,
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  },
  FAMILY: {
    name: "Family",
    slug: "family",
    books: -1,
    characters: -1,
    price: 19.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID,
  },
}

export async function getUserSubscriptionPlan(userId: string) {
  const { prisma } = await import("./prisma")
  
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
    },
  })

  if (!user) throw new Error("User not found")

  const isSubscribed =
    Boolean(user.stripeSubscriptionId) &&
    user.stripeCurrentPeriodEnd! > new Date()

  const plan = isSubscribed
    ? user.stripePriceId === process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID
      ? PLANS.FAMILY
      : PLANS.STARTER
    : PLANS.FREE

  let isCanceled = false
  if (isSubscribed && user.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    )
    isCanceled = stripePlan.cancel_at_period_end
  }

  return {
    ...plan,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    stripeCustomerId: user.stripeCustomerId,
    isSubscribed,
    isCanceled,
    isFree: !isSubscribed,
  }
}
