import type { Event, EventCategory, ShowTicket, UserPreferences } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export interface EventsResponse {
  data: Event[];
  total: number;
  lastUpdated: string;
}

export interface ShowsResponse {
  data: ShowTicket[];
  total: number;
}

export interface DigestResponse {
  digest: string;
  generatedAt: string;
}

export const api = {
  events: {
    list: (params: {
      interests?: EventCategory[];
      toddler?: boolean;
      film?: boolean;
      category?: EventCategory;
      ai?: boolean;
    }) => {
      const qs = new URLSearchParams();
      if (params.interests?.length) qs.set("interests", params.interests.join(","));
      if (params.toddler) qs.set("toddler", "true");
      if (params.film) qs.set("film", "true");
      if (params.category) qs.set("category", params.category);
      if (params.ai === false) qs.set("ai", "false");
      const query = qs.toString();
      return get<EventsResponse>(`/events${query ? `?${query}` : ""}`);
    },
    toddler: () => get<EventsResponse>("/events/toddler"),
    film: () => get<EventsResponse>("/events/film"),
    digest: (interests: EventCategory[]) =>
      get<DigestResponse>(`/events/digest?interests=${interests.join(",")}`),
  },

  shows: {
    list: () => get<ShowsResponse>("/shows"),
    open: () => get<ShowsResponse>("/shows/open"),
    check: () => post<ShowsResponse>("/shows/check", {}),
  },

  preferences: {
    get: () => get<{ data: UserPreferences }>("/preferences").then((r) => r.data),
    save: (prefs: Partial<UserPreferences>) =>
      put<{ data: UserPreferences }>("/preferences", prefs).then((r) => r.data),
  },

  notifications: {
    getVapidKey: () => get<{ publicKey: string | null; enabled: boolean }>("/notifications/vapid-key"),
    subscribe: (subscription: PushSubscriptionJSON, preferences: string[]) =>
      post("/notifications/subscribe", { subscription, preferences }),
  },
};
