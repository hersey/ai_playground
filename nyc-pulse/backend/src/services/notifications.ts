import webpush from "web-push";
import type { PushSubscription } from "../types/index.js";
import { readStore, writeStore } from "../db/store.js";

const SUBS_DB = "subscriptions.json";

// Generate VAPID keys if not set (in production, set these in .env)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:alerts@nycpulse.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export async function saveSubscription(
  subscription: object,
  preferences: string[]
): Promise<string> {
  const subs = readStore<PushSubscription[]>(SUBS_DB, []);
  const id = `sub_${Date.now()}`;
  subs.push({
    id,
    subscription,
    preferences,
    createdAt: new Date().toISOString(),
  });
  writeStore(SUBS_DB, subs);
  return id;
}

export async function sendNotification(
  title: string,
  body: string,
  url: string,
  categories: string[] = []
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log(`[Push Notification] ${title}: ${body}`);
    return;
  }

  const subs = readStore<PushSubscription[]>(SUBS_DB, []);
  const payload = JSON.stringify({
    title,
    body,
    url,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    timestamp: Date.now(),
  });

  const relevantSubs = subs.filter(
    (s) =>
      categories.length === 0 ||
      s.preferences.some((p) => categories.includes(p)) ||
      s.preferences.includes("all")
  );

  const results = await Promise.allSettled(
    relevantSubs.map((sub) =>
      webpush.sendNotification(
        sub.subscription as webpush.PushSubscription,
        payload
      )
    )
  );

  // Remove expired subscriptions (410 Gone)
  const expiredIndices = new Set<number>();
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number };
      if (err.statusCode === 410) {
        expiredIndices.add(i);
      }
    }
  });

  if (expiredIndices.size > 0) {
    const validSubs = subs.filter((_, i) => !expiredIndices.has(i));
    writeStore(SUBS_DB, validSubs);
  }
}

export async function notifyLotteryOpen(
  showName: string,
  lotteryUrl: string
): Promise<void> {
  await sendNotification(
    `🎟️ Lottery Open: ${showName}`,
    `Tickets are available now — enter the lottery before it closes!`,
    lotteryUrl,
    ["shows", "all"]
  );
}

export async function notifyNewEvents(
  count: number,
  category: string
): Promise<void> {
  await sendNotification(
    `🗽 ${count} New ${category} Events`,
    `New events matching your interests just added to NYC Pulse`,
    "/events",
    [category, "all"]
  );
}
