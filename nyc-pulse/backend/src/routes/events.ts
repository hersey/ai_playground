import { Router, Request, Response } from "express";
import { fetchAllEvents } from "../services/events.js";
import { curateEvents, generateWeeklyDigest, filterFilmmakingEvents } from "../services/claude.js";
import type { EventCategory } from "../types/index.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const interests = ((req.query.interests as string) ?? "")
      .split(",")
      .filter(Boolean) as EventCategory[];
    const toddlerMode = req.query.toddler === "true";
    const filmMode = req.query.film === "true";
    const useClaude = req.query.ai !== "false";
    const category = req.query.category as EventCategory | undefined;

    const allEvents = await fetchAllEvents({ interests, toddlerMode, filmMode });

    let filtered = allEvents;

    // Filter by category if specified
    if (category) {
      filtered = filtered.filter((e) => e.categories.includes(category));
    }

    // Filter toddler events
    if (toddlerMode) {
      filtered = filtered.filter(
        (e) => e.isToddlerFriendly || e.categories.includes("toddler")
      );
    }

    // Filter film events
    if (filmMode) {
      const filmFiltered = await filterFilmmakingEvents(
        filtered.filter(
          (e) => e.isFilmRelated || e.categories.some((c) => ["film", "screening", "meetup"].includes(c))
        )
      );
      filtered = filmMode && filmFiltered.length > 0 ? filmFiltered : filtered;
    }

    // AI curation
    if (useClaude && interests.length > 0 && process.env.ANTHROPIC_API_KEY) {
      try {
        filtered = await curateEvents(filtered, interests, { toddlerMode, filmMode });
      } catch (err) {
        console.error("[Events] Claude curation error:", err);
        // Fall back to unranked events
      }
    }

    res.json({
      data: filtered,
      total: filtered.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Events] Error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.get("/digest", async (req: Request, res: Response) => {
  try {
    const interests = ((req.query.interests as string) ?? "broadway,comedy,theater")
      .split(",")
      .filter(Boolean) as EventCategory[];

    const events = await fetchAllEvents({ interests });
    const topEvents = events.slice(0, 10);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ digest: "Set up your ANTHROPIC_API_KEY to get AI-powered weekly digests!" });
    }

    const digest = await generateWeeklyDigest(topEvents, interests);
    return res.json({ digest, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[Events] Digest error:", err);
    return res.status(500).json({ error: "Failed to generate digest" });
  }
});

router.get("/toddler", async (req: Request, res: Response) => {
  try {
    const events = await fetchAllEvents({ toddlerMode: true });
    const toddlerEvents = events.filter(
      (e) => e.isToddlerFriendly || e.categories.includes("toddler")
    );
    res.json({ data: toddlerEvents, total: toddlerEvents.length });
  } catch (err) {
    console.error("[Events] Toddler error:", err);
    res.status(500).json({ error: "Failed to fetch toddler events" });
  }
});

router.get("/film", async (req: Request, res: Response) => {
  try {
    const events = await fetchAllEvents({ filmMode: true });
    const filmEvents = events.filter(
      (e) => e.isFilmRelated || e.categories.some((c) => ["film", "screening", "volunteer", "meetup"].includes(c))
    );
    res.json({ data: filmEvents, total: filmEvents.length });
  } catch (err) {
    console.error("[Events] Film error:", err);
    res.status(500).json({ error: "Failed to fetch film events" });
  }
});

export default router;
