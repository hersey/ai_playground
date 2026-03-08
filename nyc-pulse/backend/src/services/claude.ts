import Anthropic from "@anthropic-ai/sdk";
import type { Event, EventCategory } from "../types/index.js";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Use Claude to intelligently curate and rank events based on user interests.
 * Returns enriched events with AI summaries and relevance scoring.
 */
export async function curateEvents(
  events: Event[],
  interests: EventCategory[],
  context: { toddlerMode: boolean; filmMode: boolean }
): Promise<Event[]> {
  if (events.length === 0) return [];

  const interestDescription = buildInterestDescription(interests, context);
  const eventList = events
    .slice(0, 50) // Process up to 50 events at a time
    .map((e, i) => `[${i}] ${e.title} | ${e.categories.join(",")} | ${e.date} | ${e.venue} | ${e.price}`)
    .join("\n");

  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: "adaptive" } as any,
    system: `You are a sharp NYC cultural editor who knows the city's vibrant scene inside out.
Your job is to curate and summarize events for a busy New York parent.
Be concise, warm, and enthusiastic. Know what makes something worth showing up for.`,
    messages: [
      {
        role: "user",
        content: `Here are NYC events this week. The user is interested in: ${interestDescription}

Events:
${eventList}

For each event (use its index number), write a ONE-sentence punchy summary (max 15 words) that tells a busy person WHY they should care.
Also rate relevance 1-10 for this user's interests.

Respond with a JSON array: [{"index": 0, "summary": "...", "relevance": 8}, ...]
Only include events with relevance >= 5. Sort by relevance descending.`,
      },
    ],
  });

  const response = await stream.finalMessage();
  const text = response.content.find((b) => b.type === "text")?.text ?? "[]";

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return events;

    const curated = JSON.parse(jsonMatch[0]) as Array<{
      index: number;
      summary: string;
      relevance: number;
    }>;

    const indexedEvents = new Map(events.map((e, i) => [i, e]));
    const mapped = curated
      .filter((c) => c.relevance >= 5)
      .sort((a, b) => b.relevance - a.relevance)
      .map((c) => {
        const event = indexedEvents.get(c.index);
        if (!event) return null;
        return { ...event, aiSummary: c.summary } as Event;
      });
    return mapped.filter((e): e is NonNullable<typeof e> => e !== null) as Event[];
  } catch {
    return events;
  }
}

/**
 * Use Claude to discover and enrich show lottery information.
 */
export async function enrichShowInfo(showName: string): Promise<string> {
  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Write a 2-sentence description of "${showName}" TV show — what it is, when it tapes, and why a New Yorker should try to get tickets. Be enthusiastic and practical.`,
      },
    ],
  });
  const response = await stream.finalMessage();
  return response.content.find((b) => b.type === "text")?.text ?? "";
}

/**
 * Use Claude to generate a weekly NYC digest.
 */
export async function generateWeeklyDigest(
  topEvents: Event[],
  userInterests: EventCategory[]
): Promise<string> {
  const eventSummaries = topEvents
    .slice(0, 10)
    .map((e) => `- ${e.title} (${new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}) at ${e.venue}`)
    .join("\n");

  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: "adaptive" } as any,
    system: "You are a witty NYC cultural writer. Be brief, warm, and exciting.",
    messages: [
      {
        role: "user",
        content: `Write a punchy 3-sentence "This Week in NYC" intro for a busy parent who loves: ${userInterests.join(", ")}.
Then list these top picks with one-line commentary for each:

${eventSummaries}

Keep it under 200 words total. Make it feel like a text from a cool friend who knows everything happening.`,
      },
    ],
  });

  const response = await stream.finalMessage();
  return response.content.find((b) => b.type === "text")?.text ?? "";
}

/**
 * Use Claude to find filmmaking-specific events from a broader list.
 */
export async function filterFilmmakingEvents(events: Event[]): Promise<Event[]> {
  if (events.length === 0) return [];

  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `From these NYC events, identify ones relevant to aspiring filmmakers (screenings, film meetups, industry networking, set volunteering, film school events, shorts programs, etc.).

Events (as JSON):
${JSON.stringify(events.slice(0, 30).map((e, i) => ({ i, title: e.title, desc: e.description.slice(0, 100), cats: e.categories })))}

Return JSON array of indices that are filmmaking-relevant: [0, 3, 7, ...]`,
      },
    ],
  });

  const response = await stream.finalMessage();
  const text = response.content.find((b) => b.type === "text")?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return events.filter((e) => e.isFilmRelated);

  try {
    const indices = JSON.parse(jsonMatch[0]) as number[];
    return indices.map((i) => ({ ...events[i], isFilmRelated: true })).filter(Boolean);
  } catch {
    return events.filter((e) => e.isFilmRelated);
  }
}

function buildInterestDescription(
  interests: EventCategory[],
  context: { toddlerMode: boolean; filmMode: boolean }
): string {
  const parts = [...interests];
  if (context.toddlerMode) parts.push("toddler" as EventCategory);
  if (context.filmMode) parts.push("film" as EventCategory, "screening" as EventCategory);
  return parts.join(", ") || "general NYC events";
}
