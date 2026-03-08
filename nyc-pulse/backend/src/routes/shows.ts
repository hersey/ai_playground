import { Router, Request, Response } from "express";
import { getAllShows, getOpenLotteries, monitorShowAvailability, getShowById } from "../services/shows.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const shows = await getAllShows();
    res.json({ data: shows, total: shows.length });
  } catch (err) {
    console.error("[Shows] Error:", err);
    res.status(500).json({ error: "Failed to fetch shows" });
  }
});

router.get("/open", async (_req: Request, res: Response) => {
  try {
    const open = await getOpenLotteries();
    res.json({ data: open, total: open.length });
  } catch (err) {
    console.error("[Shows] Open lotteries error:", err);
    res.status(500).json({ error: "Failed to fetch open lotteries" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const show = await getShowById(req.params["id"] as string);
    if (!show) return res.status(404).json({ error: "Show not found" });
    return res.json({ data: show });
  } catch (err) {
    console.error("[Shows] Get show error:", err);
    return res.status(500).json({ error: "Failed to fetch show" });
  }
});

// Manually trigger a show check (useful for testing)
router.post("/check", async (_req: Request, res: Response) => {
  try {
    await monitorShowAvailability();
    const shows = await getAllShows();
    res.json({ message: "Show status updated", data: shows });
  } catch (err) {
    console.error("[Shows] Manual check error:", err);
    res.status(500).json({ error: "Failed to check shows" });
  }
});

export default router;
