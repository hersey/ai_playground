import axios from "axios";
import * as cheerio from "cheerio";
import type { Event, EventCategory, EventSource } from "../types/index.js";
import { readCache, writeCache } from "../db/store.js";

const NYC_NEIGHBORHOODS = [
  "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island",
  "Midtown", "Downtown", "Upper West Side", "Upper East Side",
  "East Village", "West Village", "SoHo", "Tribeca", "Williamsburg",
  "DUMBO", "Park Slope", "Astoria", "Long Island City", "Harlem",
  "Chelsea", "Hell's Kitchen", "Lower East Side", "Bushwick"
];

/**
 * Fetch events from Eventbrite (free public API, no auth needed for public events)
 */
async function fetchEventbriteEvents(): Promise<Event[]> {
  const cached = readCache<Event[]>("eventbrite");
  if (cached) return cached;

  try {
    // Eventbrite public search endpoint
    const response = await axios.get(
      "https://www.eventbrite.com/api/v3/destination/events/",
      {
        params: {
          "event_ids": "",
          "expand": "venue,ticket_availability",
          "place_id": "ChIJOwg_06VPwokRYv534QaPC8g", // NYC Google Place ID
          "dates": "this_week",
          "page_size": 50,
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NYCPulse/1.0)",
        },
        timeout: 10000,
      }
    );

    const events = parseEventbriteResponse(response.data);
    writeCache("eventbrite", events, 30 * 60 * 1000); // 30 min cache
    return events;
  } catch {
    // Fallback to curated mock data if API unavailable
    return getCuratedEvents();
  }
}

/**
 * Fetch events from NYC Open Data (truly free, no API key needed)
 */
async function fetchNYCOpenDataEvents(): Promise<Event[]> {
  const cached = readCache<Event[]>("nycdata");
  if (cached) return cached;

  try {
    const response = await axios.get(
      "https://data.cityofnewyork.us/resource/tvpp-9vvx.json",
      {
        params: {
          "$limit": 50,
          "$where": `start_date_time >= '${new Date().toISOString()}'`,
          "$order": "start_date_time ASC",
        },
        timeout: 10000,
      }
    );

    const events = parseNYCOpenDataResponse(response.data);
    writeCache("nycdata", events, 60 * 60 * 1000); // 1 hour cache
    return events;
  } catch {
    return [];
  }
}

/**
 * Scrape Meetup events for NYC (public pages, no auth needed)
 */
async function fetchMeetupEvents(topics: string[]): Promise<Event[]> {
  const cacheKey = `meetup_${topics.join("_")}`;
  const cached = readCache<Event[]>(cacheKey);
  if (cached) return cached;

  const allEvents: Event[] = [];

  for (const topic of topics.slice(0, 3)) {
    try {
      const response = await axios.get(
        `https://www.meetup.com/find/events/`,
        {
          params: {
            location: "New York, NY",
            keywords: topic,
            radius: 10,
          },
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
          },
          timeout: 8000,
        }
      );

      const events = parseMeetupHTML(response.data, topic);
      allEvents.push(...events);
    } catch {
      // Silently skip if meetup blocks the request
    }
  }

  writeCache(cacheKey, allEvents, 45 * 60 * 1000); // 45 min cache
  return allEvents;
}

/**
 * Scrape NYC Parks events (free, no auth)
 */
async function fetchNYCParksEvents(): Promise<Event[]> {
  const cached = readCache<Event[]>("nycparks");
  if (cached) return cached;

  try {
    const response = await axios.get(
      "https://www.nycgovparks.org/programs/recreation/upcoming-events",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NYCPulse/1.0)" },
        timeout: 10000,
      }
    );

    const events = parseNYCParksHTML(response.data);
    writeCache("nycparks", events, 2 * 60 * 60 * 1000); // 2 hour cache
    return events;
  } catch {
    return [];
  }
}

/**
 * Main aggregator: fetch from all sources and combine
 */
export async function fetchAllEvents(options: {
  interests?: EventCategory[];
  toddlerMode?: boolean;
  filmMode?: boolean;
} = {}): Promise<Event[]> {
  const [eventbriteEvents, nycDataEvents, parksEvents] = await Promise.allSettled([
    fetchEventbriteEvents(),
    fetchNYCOpenDataEvents(),
    fetchNYCParksEvents(),
  ]);

  const meetupTopics: string[] = [];
  if (options.filmMode) meetupTopics.push("filmmaking", "film");
  if (options.toddlerMode) meetupTopics.push("toddler");
  if (options.interests?.includes("comedy")) meetupTopics.push("comedy");

  const meetupEvents = meetupTopics.length > 0
    ? await fetchMeetupEvents(meetupTopics)
    : [];

  const allEvents: Event[] = [
    ...(eventbriteEvents.status === "fulfilled" ? eventbriteEvents.value : []),
    ...(nycDataEvents.status === "fulfilled" ? nycDataEvents.value : []),
    ...(parksEvents.status === "fulfilled" ? parksEvents.value : []),
    ...meetupEvents,
    ...getCuratedEvents(),
  ];

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped = allEvents.filter((e) => {
    const key = e.title.toLowerCase().replace(/\s+/g, "").slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Apply filters
  return deduped
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ---- Parsers ----

function parseEventbriteResponse(data: unknown): Event[] {
  try {
    const d = data as { events?: Array<{
      id: string;
      name: { text: string };
      description?: { text: string };
      start: { utc: string };
      end?: { utc: string };
      venue?: { name: string; address: { localized_address_display: string } };
      url: string;
      logo?: { url: string };
      is_free: boolean;
      ticket_availability?: { minimum_ticket_price?: { major_value: string }; maximum_ticket_price?: { major_value: string } };
      category_id?: string;
    }> };
    if (!d.events) return [];

    return d.events.map((e) => ({
      id: `eb_${e.id}`,
      title: e.name.text,
      description: e.description?.text ?? "",
      date: e.start.utc,
      endDate: e.end?.utc,
      venue: e.venue?.name ?? "NYC",
      address: e.venue?.address.localized_address_display ?? "New York, NY",
      price: e.is_free ? "Free" : formatPrice(
        e.ticket_availability?.minimum_ticket_price?.major_value,
        e.ticket_availability?.maximum_ticket_price?.major_value
      ),
      url: e.url,
      imageUrl: e.logo?.url,
      categories: guessCategories(e.name.text, e.description?.text ?? ""),
      tags: [],
      source: "eventbrite" as EventSource,
    }));
  } catch {
    return [];
  }
}

function parseNYCOpenDataResponse(data: unknown): Event[] {
  try {
    const rows = data as Array<{
      event_name?: string;
      event_description?: string;
      start_date_time?: string;
      end_date_time?: string;
      event_location?: string;
      event_borough?: string;
      event_address?: string;
      event_type?: string;
      event_url?: string;
    }>;

    return rows
      .filter((r) => r.event_name && r.start_date_time)
      .map((r, i) => ({
        id: `nyc_${i}_${r.start_date_time}`,
        title: r.event_name!,
        description: r.event_description ?? "",
        date: r.start_date_time!,
        endDate: r.end_date_time,
        venue: r.event_location ?? "New York City",
        address: `${r.event_address ?? ""} ${r.event_borough ?? "New York"}, NY`.trim(),
        price: "Free",
        url: r.event_url ?? "https://nyc.gov/events",
        categories: guessCategories(r.event_name!, r.event_description ?? ""),
        tags: [r.event_type ?? ""],
        source: "nycgov" as EventSource,
      }));
  } catch {
    return [];
  }
}

function parseMeetupHTML(html: string, topic: string): Event[] {
  const $ = cheerio.load(html);
  const events: Event[] = [];

  $("[data-event-id], .event-listing, article.eventCard").each((i, el) => {
    const title = $(el).find("h2, h3, .eventCard--name").first().text().trim();
    const dateText = $(el).find("time, .eventCard--date").first().text().trim();
    const venue = $(el).find(".eventCard--venue, .venueDisplay").first().text().trim();
    const url = $(el).find("a").first().attr("href") ?? "";

    if (!title || !dateText) return;

    events.push({
      id: `meetup_${i}_${title.slice(0, 20).replace(/\s/g, "_")}`,
      title,
      description: $(el).find(".eventCard--details, p").first().text().trim(),
      date: parseFlexibleDate(dateText) ?? new Date().toISOString(),
      venue: venue || "NYC",
      address: "New York, NY",
      price: "Free",
      url: url.startsWith("http") ? url : `https://meetup.com${url}`,
      categories: guessCategories(title, topic),
      tags: [topic],
      source: "meetup" as EventSource,
    });
  });

  return events;
}

function parseNYCParksHTML(html: string): Event[] {
  const $ = cheerio.load(html);
  const events: Event[] = [];

  $(".event-listing, .program-listing, tr.event-row").each((i, el) => {
    const title = $(el).find("h3, h4, .event-title, td.event-name").first().text().trim();
    const dateText = $(el).find(".date, .event-date, td.date").first().text().trim();
    const location = $(el).find(".location, .park-name, td.location").first().text().trim();

    if (!title) return;

    events.push({
      id: `parks_${i}`,
      title,
      description: $(el).find("p, .description").first().text().trim(),
      date: parseFlexibleDate(dateText) ?? new Date().toISOString(),
      venue: location || "NYC Parks",
      address: "New York, NY",
      price: "Free",
      url: "https://www.nycgovparks.org/programs/recreation",
      categories: guessCategories(title, location),
      tags: ["parks", "outdoor"],
      source: "nycparks" as EventSource,
      isToddlerFriendly: /kids?|children|family|toddler|youth/i.test(title),
    });
  });

  return events;
}

// ---- Curated fallback events (always available) ----

function getCuratedEvents(): Event[] {
  const now = new Date();
  const thisWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return d;
  });

  function dayAt(dayOffset: number, hour: number, minute = 0): string {
    const d = new Date(thisWeek[dayOffset] ?? thisWeek[0]);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  return [
    {
      id: "curated_1",
      title: "Broadway in Bryant Park",
      description: "Free outdoor performances from current and upcoming Broadway shows. A beloved NYC summer tradition with surprise performances from top shows.",
      date: dayAt(2, 12, 30),
      venue: "Bryant Park",
      address: "6th Ave & 42nd St, New York, NY 10018",
      neighborhood: "Midtown",
      price: "Free",
      url: "https://bryantpark.org",
      categories: ["broadway", "theater", "outdoor"],
      tags: ["free", "outdoor", "broadway", "midtown"],
      source: "curated",
      isFeatured: true,
      isToddlerFriendly: true,
    },
    {
      id: "curated_2",
      title: "Rooftop Films Summer Series",
      description: "Outdoor film screenings on Brooklyn rooftops with live music. One of NYC's most magical cinema experiences — indie films under the stars.",
      date: dayAt(4, 20, 0),
      venue: "Industry City Rooftop",
      address: "220 36th St, Brooklyn, NY 11232",
      neighborhood: "Sunset Park",
      price: "$18",
      priceMin: 18,
      url: "https://rooftopfilms.com",
      categories: ["film", "screening"],
      tags: ["indie", "film", "outdoor", "brooklyn", "rooftop"],
      source: "curated",
      isFeatured: true,
      isFilmRelated: true,
    },
    {
      id: "curated_3",
      title: "NYC Short Film Festival Mixer",
      description: "Monthly networking event for NYC filmmakers — meet directors, DPs, writers, and crew. Screenings of short films followed by Q&A with filmmakers.",
      date: dayAt(3, 19, 0),
      venue: "Metrograph Cinema",
      address: "7 Ludlow St, New York, NY 10002",
      neighborhood: "Lower East Side",
      price: "$15",
      priceMin: 15,
      url: "https://metrograph.com",
      categories: ["film", "screening", "networking", "meetup"],
      tags: ["film", "networking", "shorts", "directors", "indie"],
      source: "curated",
      isFilmRelated: true,
    },
    {
      id: "curated_4",
      title: "Museum of Natural History Family Morning",
      description: "Special early access for families with young children before general admission. Science exploration designed specifically for toddlers and preschoolers.",
      date: dayAt(0, 9, 0),
      venue: "American Museum of Natural History",
      address: "200 Central Park West, New York, NY 10024",
      neighborhood: "Upper West Side",
      price: "$23",
      priceMin: 23,
      url: "https://amnh.org",
      categories: ["toddler", "cultural"],
      tags: ["museum", "toddler", "family", "dinosaurs", "science"],
      source: "curated",
      isToddlerFriendly: true,
    },
    {
      id: "curated_5",
      title: "Comedy Cellar Open Mic Night",
      description: "The legendary Comedy Cellar's open mic — where many SNL cast members and Netflix specials were born. See tomorrow's comedy stars tonight.",
      date: dayAt(1, 21, 0),
      venue: "Comedy Cellar",
      address: "117 MacDougal St, New York, NY 10012",
      neighborhood: "Greenwich Village",
      price: "2-drink minimum",
      url: "https://comedycellar.com",
      categories: ["comedy"],
      tags: ["comedy", "standup", "openmic", "greenwich"],
      source: "curated",
    },
    {
      id: "curated_6",
      title: "Storytime at Brooklyn Public Library",
      description: "Weekly interactive storytime for children ages 2-5. Songs, movement, and stories designed for toddlers. No registration required.",
      date: dayAt(1, 10, 30),
      venue: "Brooklyn Public Library – Central Branch",
      address: "10 Grand Army Plaza, Brooklyn, NY 11238",
      neighborhood: "Park Slope",
      price: "Free",
      url: "https://bklynlibrary.org",
      categories: ["toddler", "community"],
      tags: ["free", "toddler", "storytime", "library", "brooklyn"],
      source: "curated",
      isToddlerFriendly: true,
    },
    {
      id: "curated_7",
      title: "Smorgasburg Brooklyn",
      description: "NYC's legendary open-air food market with 100+ local vendors. The best food market in the country — a rite of passage for any New Yorker.",
      date: dayAt(5, 11, 0),
      venue: "Smorgasburg Williamsburg",
      address: "90 Kent Ave, Brooklyn, NY 11211",
      neighborhood: "Williamsburg",
      price: "Free entry",
      url: "https://smorgasburg.com",
      categories: ["food", "outdoor"],
      tags: ["food", "market", "outdoor", "brooklyn", "williamsburg"],
      source: "curated",
      isFeatured: true,
      isToddlerFriendly: true,
    },
    {
      id: "curated_8",
      title: "Chelsea Gallery Walk",
      description: "Self-guided tour of Chelsea's world-class contemporary art galleries. 200+ galleries in one neighborhood — the beating heart of NYC's art scene.",
      date: dayAt(5, 11, 0),
      venue: "Chelsea Art District",
      address: "W 20th–26th St & 10th–11th Ave, New York, NY",
      neighborhood: "Chelsea",
      price: "Free",
      url: "https://chelseagalleries.com",
      categories: ["art", "gallery", "cultural"],
      tags: ["art", "gallery", "free", "chelsea", "contemporary"],
      source: "curated",
    },
    {
      id: "curated_9",
      title: "Independent Film Production Volunteer Call",
      description: "NYC indie feature needs crew volunteers across all departments — great way to build your reel and make industry contacts. All experience levels welcome.",
      date: dayAt(2, 7, 0),
      venue: "Various NYC Locations",
      address: "New York, NY",
      price: "Free (Meals provided)",
      url: "https://mandy.com",
      categories: ["film", "volunteer"],
      tags: ["film", "volunteer", "crew", "indie", "production"],
      source: "curated",
      isFilmRelated: true,
    },
    {
      id: "curated_10",
      title: "Central Park Carousel Family Day",
      description: "The historic 1908 carousel in Central Park — a pure NYC classic for toddlers. Combine with a picnic on the Sheep Meadow for a perfect family afternoon.",
      date: dayAt(5, 10, 0),
      venue: "Central Park Carousel",
      address: "Mid-Park at 64th St, New York, NY 10024",
      neighborhood: "Central Park",
      price: "$3 per ride",
      priceMin: 3,
      url: "https://centralparknyc.org",
      categories: ["toddler", "outdoor"],
      tags: ["toddler", "family", "carousel", "centralpark", "outdoor"],
      source: "curated",
      isToddlerFriendly: true,
    },
    {
      id: "curated_11",
      title: "Film Freeway Screening: NYC Shorts Showcase",
      description: "Monthly showcase of NYC-produced short films across all genres. Filmmakers present their work and take audience Q&A. Great for networking and inspiration.",
      date: dayAt(6, 18, 30),
      venue: "Anthology Film Archives",
      address: "32 2nd Ave, New York, NY 10003",
      neighborhood: "East Village",
      price: "$12",
      priceMin: 12,
      url: "https://anthologyfilmarchives.org",
      categories: ["film", "screening", "meetup"],
      tags: ["film", "shorts", "screening", "networking", "eastvillage"],
      source: "curated",
      isFilmRelated: true,
      isFeatured: true,
    },
    {
      id: "curated_12",
      title: "Broadway Lottery: Hamilton",
      description: "Daily digital lottery for $10 seats to one of Broadway's greatest shows. Easy to enter — takes 30 seconds. Results posted 2 days before the show.",
      date: dayAt(0, 9, 0),
      venue: "Richard Rodgers Theatre",
      address: "226 W 46th St, New York, NY 10036",
      neighborhood: "Theater District",
      price: "$10 (lottery)",
      priceMin: 10,
      url: "https://hamiltonmusical.com/lottery",
      categories: ["broadway", "theater"],
      tags: ["broadway", "lottery", "hamilton", "musical"],
      source: "curated",
      isFeatured: true,
    },
    {
      id: "curated_13",
      title: "The Met: Sensory-Friendly Family Tours",
      description: "The Metropolitan Museum offers specially designed tours for families with young children. Slower pace, interactive elements, and tactile experiences for little ones.",
      date: dayAt(1, 10, 0),
      venue: "The Metropolitan Museum of Art",
      address: "1000 5th Ave, New York, NY 10028",
      neighborhood: "Upper East Side",
      price: "Pay what you wish",
      url: "https://metmuseum.org",
      categories: ["toddler", "art", "cultural"],
      tags: ["museum", "toddler", "family", "art", "sensory", "free"],
      source: "curated",
      isToddlerFriendly: true,
    },
    {
      id: "curated_14",
      title: "NYC Filmmakers Collective Monthly Meetup",
      description: "The city's most active filmmaking community meets monthly. Pitch sessions, equipment swaps, mentorship, and crew matching. 500+ members strong.",
      date: dayAt(3, 18, 30),
      venue: "WeWork Bryant Park",
      address: "25 W 39th St, New York, NY 10018",
      neighborhood: "Midtown",
      price: "Free",
      url: "https://meetup.com",
      categories: ["film", "meetup", "networking"],
      tags: ["film", "filmmakers", "meetup", "networking", "community"],
      source: "curated",
      isFilmRelated: true,
    },
    {
      id: "curated_15",
      title: "The Public Theater: Free Shakespeare in the Park",
      description: "The beloved free outdoor Shakespeare performances in Central Park. One of NYC's great democratic traditions — first-come, first-served tickets.",
      date: dayAt(4, 20, 0),
      venue: "Delacorte Theater, Central Park",
      address: "Central Park West & 81st St, New York, NY 10024",
      neighborhood: "Central Park",
      price: "Free",
      url: "https://publictheater.org/shakespeare-in-the-park",
      categories: ["theater", "outdoor", "cultural"],
      tags: ["theater", "shakespeare", "free", "outdoor", "centralpark"],
      source: "curated",
      isFeatured: true,
    },
  ];
}

// ---- Helpers ----

function guessCategories(title: string, description: string): EventCategory[] {
  const text = `${title} ${description}`.toLowerCase();
  const categories: EventCategory[] = [];

  if (/broadway|musical|theater|theatre|play|show/.test(text)) {
    if (/broadway/.test(text)) categories.push("broadway");
    else categories.push("theater");
  }
  if (/comedy|standup|improv|sketch/.test(text)) categories.push("comedy");
  if (/film|movie|cinema|screening|documentary/.test(text)) {
    categories.push("film");
    if (/screen/.test(text)) categories.push("screening");
  }
  if (/art|gallery|exhibit|museum/.test(text)) {
    categories.push("art");
    if (/gallery/.test(text)) categories.push("gallery");
  }
  if (/music|concert|jazz|live music/.test(text)) categories.push("music");
  if (/food|restaurant|dining|chef|culinary|market|tasting/.test(text)) categories.push("food");
  if (/kid|child|toddler|family|baby|preschool/.test(text)) categories.push("toddler");
  if (/outdoor|park|garden|rooftop/.test(text)) categories.push("outdoor");
  if (/cultural|heritage|history|tradition/.test(text)) categories.push("cultural");
  if (/meetup|networking|mixer|professional/.test(text)) {
    categories.push("meetup");
    categories.push("networking");
  }
  if (/volunteer|crew|production|filmmaking/.test(text)) categories.push("volunteer");
  if (/festival|fair|carnival/.test(text)) categories.push("festival");

  return categories.length > 0 ? categories : ["community"];
}

function formatPrice(min?: string, max?: string): string {
  if (!min) return "Free";
  if (!max || min === max) return `$${min}`;
  return `$${min}–$${max}`;
}

function parseFlexibleDate(text: string): string | null {
  try {
    const d = new Date(text);
    if (!isNaN(d.getTime())) return d.toISOString();

    // Try common formats like "Thu, Jan 15 at 7:00 PM"
    const match = text.match(/(\w+ \d+)\s+at\s+(\d+:\d+\s*[AP]M)/i);
    if (match) {
      const d2 = new Date(`${match[1]} ${new Date().getFullYear()} ${match[2]}`);
      if (!isNaN(d2.getTime())) return d2.toISOString();
    }
    return null;
  } catch {
    return null;
  }
}
