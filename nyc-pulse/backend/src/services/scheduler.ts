import cron from "node-cron";
import { monitorShowAvailability, getAllShows } from "./shows.js";
import { notifyLotteryOpen } from "./notifications.js";
import { readStore, writeStore } from "../db/store.js";

let schedulerStarted = false;

export function startScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[Scheduler] Starting background jobs...");

  // Check show lottery availability every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Scheduler] Checking show lottery availability...");
    try {
      const prevShows = await getAllShows();
      const prevOpen = new Set(prevShows.filter((s) => s.isLotteryOpen).map((s) => s.id));

      await monitorShowAvailability();

      const currentShows = await getAllShows();
      for (const show of currentShows) {
        if (show.isLotteryOpen && !prevOpen.has(show.id)) {
          // Lottery just opened — notify!
          console.log(`[Scheduler] Lottery OPENED: ${show.showName}`);
          await notifyLotteryOpen(show.showName, show.lotteryUrl);
        }
      }
    } catch (err) {
      console.error("[Scheduler] Show monitoring error:", err);
    }
  });

  // Clear old cache entries every 6 hours
  cron.schedule("0 */6 * * *", () => {
    console.log("[Scheduler] Cleaning up cache...");
    writeStore("cache.json", {});
  });

  // Log daily status at 9 AM
  cron.schedule("0 9 * * *", async () => {
    const shows = await getAllShows();
    const openCount = shows.filter((s) => s.isLotteryOpen).length;
    console.log(`[Scheduler] Daily status: ${openCount}/${shows.length} show lotteries open`);
  });

  console.log("[Scheduler] Background jobs scheduled.");
}
