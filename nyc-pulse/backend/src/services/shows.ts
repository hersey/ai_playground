import axios from "axios";
import * as cheerio from "cheerio";
import type { ShowTicket } from "../types/index.js";
import { readStore, writeStore, readCache, writeCache } from "../db/store.js";

const SHOWS_DB = "shows.json";

const MONITORED_SHOWS: Omit<ShowTicket, "isLotteryOpen" | "lastChecked">[] = [
  {
    id: "daily-show",
    showName: "The Daily Show",
    host: "Jon Stewart",
    network: "Comedy Central",
    description: "America's most trusted fake news. Jon Stewart returns to The Daily Show — weeknight tapings in NYC.",
    lotteryUrl: "https://1iota.com/show/the-daily-show",
    ticketingPlatform: "1iota",
    howToApply: "Register free on 1iota.com, search 'The Daily Show', and join the standby or lottery list. Check back weekly — new dates drop every Monday.",
  },
  {
    id: "colbert",
    showName: "The Late Show with Stephen Colbert",
    host: "Stephen Colbert",
    network: "CBS",
    description: "The sharpest political wit in late night, live from the Ed Sullivan Theater on Broadway. Tapings Mon–Thu evenings.",
    lotteryUrl: "https://1iota.com/show/the-late-show-with-stephen-colbert",
    ticketingPlatform: "1iota",
    howToApply: "Sign up on 1iota.com (free). Tickets go fast — set up a 1iota account and request tickets early. Standby lines often work too.",
  },
  {
    id: "seth-meyers",
    showName: "Late Night with Seth Meyers",
    host: "Seth Meyers",
    network: "NBC",
    description: "Witty, topical late night at 30 Rock. Seth Meyers delivers sharp A Closer Look monologues and great interviews.",
    lotteryUrl: "https://1iota.com/show/late-night-with-seth-meyers",
    ticketingPlatform: "1iota",
    howToApply: "Request tickets via 1iota.com. NBC also occasionally releases tickets directly through their website.",
  },
  {
    id: "fallon",
    showName: "The Tonight Show Starring Jimmy Fallon",
    host: "Jimmy Fallon",
    network: "NBC",
    description: "The quintessential NYC late night experience, live from 30 Rock. Games, music, and the Roots as house band.",
    lotteryUrl: "https://www.1iota.com/show/the-tonight-show-starring-jimmy-fallon",
    ticketingPlatform: "1iota",
    howToApply: "Tickets via 1iota.com. This is one of the hottest tickets in NYC — sign up for 1iota alerts to catch availability the moment it opens.",
  },
  {
    id: "snl",
    showName: "Saturday Night Live",
    host: "Various hosts",
    network: "NBC",
    description: "The institution of American comedy, live every Saturday night from Studio 8H at 30 Rock. The annual lottery opens in August.",
    lotteryUrl: "https://www.nbc.com/tickets-to-snl",
    ticketingPlatform: "show-site",
    howToApply: "NBC runs an annual email lottery in August for the entire season. Email SNL_Lottery@nbcuni.com in August. Standby lines start at 7AM on Saturday — arrive by 7AM for a chance.",
  },
  {
    id: "john-oliver",
    showName: "Last Week Tonight with John Oliver",
    host: "John Oliver",
    network: "HBO",
    description: "The gold standard of long-form political comedy. Taped weekly on Sundays in NYC with an intimate studio audience.",
    lotteryUrl: "https://1iota.com/show/last-week-tonight-with-john-oliver",
    ticketingPlatform: "1iota",
    howToApply: "Tickets through 1iota.com. This is a small, intimate taping — tickets are coveted but do become available. Check 1iota frequently and set up email alerts.",
  },
  {
    id: "gma",
    showName: "Good Morning America",
    host: "Robin Roberts, George Stephanopoulos",
    network: "ABC",
    description: "Wake up to live GMA at Times Square — free outdoor concerts, celebrity interviews, and the buzz of morning TV.",
    lotteryUrl: "https://abc.com/shows/good-morning-america/tickets",
    ticketingPlatform: "show-site",
    howToApply: "Free outdoor viewing at Times Square (no ticket needed). Indoor studio tickets: email GMA@goodmorningamerica.com at least 3 months ahead.",
  },
  {
    id: "today-show",
    showName: "The Today Show",
    host: "Savannah Guthrie, Hoda Kotb",
    network: "NBC",
    description: "Join the crowd outside Studio 1A at Rockefeller Plaza for the iconic outdoor plaza segments with live music and celebrity guests.",
    lotteryUrl: "https://www.today.com/popculture/today-tickets",
    ticketingPlatform: "show-site",
    howToApply: "Free to stand outside Rockefeller Plaza at 48th & 5th Ave (arrive by 7AM). Indoor studio: request tickets 6+ months in advance at today.com.",
  },
];

export async function getAllShows(): Promise<ShowTicket[]> {
  const cached = readCache<ShowTicket[]>("shows_status");
  if (cached) return cached;

  const stored = readStore<ShowTicket[]>(SHOWS_DB, []);
  if (stored.length > 0) return stored;

  // Initialize with defaults
  return MONITORED_SHOWS.map((s) => ({
    ...s,
    isLotteryOpen: false,
    lastChecked: new Date().toISOString(),
  }));
}

/**
 * Check 1iota for ticket availability for a specific show
 */
async function check1iotaAvailability(showId: string, showName: string): Promise<{ isOpen: boolean; nextDate?: string }> {
  try {
    const searchUrl = `https://1iota.com/show/${showId}`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xhtml+xml,application/xhtml+xml",
      },
      timeout: 8000,
    });

    const $ = cheerio.load(response.data);

    // Look for "Request Tickets", "Available", lottery open indicators
    const pageText = $("body").text().toLowerCase();
    const isOpen =
      pageText.includes("request tickets") ||
      pageText.includes("tickets available") ||
      pageText.includes("join the list") ||
      $(".btn-request, .ticket-btn, [data-action='request']").length > 0;

    // Try to find the next taping date
    const dateText = $(".show-date, .event-date, .taping-date").first().text().trim();

    return { isOpen, nextDate: dateText || undefined };
  } catch {
    return { isOpen: false };
  }
}

/**
 * Monitor all shows for ticket availability
 */
export async function monitorShowAvailability(): Promise<void> {
  const shows = await getAllShows();
  const updatedShows: ShowTicket[] = [];

  for (const show of shows) {
    let isOpen = false;
    let lotteryOpensAt: string | undefined;

    try {
      if (show.ticketingPlatform === "1iota") {
        const result = await check1iotaAvailability(show.id, show.showName);
        isOpen = result.isOpen;
        lotteryOpensAt = result.nextDate;
      }
    } catch {
      // Keep previous state if check fails
      isOpen = show.isLotteryOpen;
    }

    updatedShows.push({
      ...show,
      isLotteryOpen: isOpen,
      lotteryOpensAt,
      lastChecked: new Date().toISOString(),
    });
  }

  writeStore(SHOWS_DB, updatedShows);
  writeCache("shows_status", updatedShows, 15 * 60 * 1000); // 15 min cache
}

export async function getShowById(id: string): Promise<ShowTicket | null> {
  const shows = await getAllShows();
  return shows.find((s) => s.id === id) ?? null;
}

/**
 * Get shows with open lotteries
 */
export async function getOpenLotteries(): Promise<ShowTicket[]> {
  const shows = await getAllShows();
  return shows.filter((s) => s.isLotteryOpen);
}
