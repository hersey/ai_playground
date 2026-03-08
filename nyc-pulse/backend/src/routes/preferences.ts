import { Router, Request, Response } from "express";
import { readStore, writeStore } from "../db/store.js";
import type { UserPreferences } from "../types/index.js";

const router = Router();
const PREFS_DB = "preferences.json";

const DEFAULT_PREFERENCES: UserPreferences = {
  interests: ["broadway", "comedy", "theater", "art"],
  neighborhoods: [],
  maxPrice: null,
  toddlerMode: false,
  filmMode: false,
  notificationsEnabled: false,
  showLotteryAlerts: ["colbert", "fallon", "snl", "john-oliver"],
};

router.get("/", (_req: Request, res: Response) => {
  const prefs = readStore<UserPreferences>(PREFS_DB, DEFAULT_PREFERENCES);
  res.json({ data: prefs });
});

router.put("/", (req: Request, res: Response) => {
  const existing = readStore<UserPreferences>(PREFS_DB, DEFAULT_PREFERENCES);
  const updated: UserPreferences = {
    ...existing,
    ...req.body,
    // Ensure arrays are arrays
    interests: Array.isArray(req.body.interests) ? req.body.interests : existing.interests,
    neighborhoods: Array.isArray(req.body.neighborhoods) ? req.body.neighborhoods : existing.neighborhoods,
    showLotteryAlerts: Array.isArray(req.body.showLotteryAlerts) ? req.body.showLotteryAlerts : existing.showLotteryAlerts,
  };
  writeStore(PREFS_DB, updated);
  res.json({ data: updated, message: "Preferences saved" });
});

router.delete("/", (_req: Request, res: Response) => {
  writeStore(PREFS_DB, DEFAULT_PREFERENCES);
  res.json({ data: DEFAULT_PREFERENCES, message: "Preferences reset" });
});

export default router;
