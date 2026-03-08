export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  endDate?: string;
  venue: string;
  address: string;
  neighborhood?: string;
  price: string; // "Free", "$10", "$10-$50"
  priceMin?: number;
  priceMax?: number;
  url: string;
  imageUrl?: string;
  categories: EventCategory[];
  tags: string[];
  source: EventSource;
  isFeatured?: boolean;
  isToddlerFriendly?: boolean;
  isFilmRelated?: boolean;
  aiSummary?: string;
}

export type EventCategory =
  | "broadway"
  | "comedy"
  | "theater"
  | "art"
  | "music"
  | "food"
  | "film"
  | "toddler"
  | "outdoor"
  | "cultural"
  | "community"
  | "networking"
  | "sports"
  | "festival"
  | "gallery"
  | "screening"
  | "meetup"
  | "volunteer";

export type EventSource =
  | "eventbrite"
  | "nycgov"
  | "meetup"
  | "broadway"
  | "curated"
  | "timeout"
  | "nycparks";

export interface ShowTicket {
  id: string;
  showName: string;
  host: string;
  network: string;
  description: string;
  lotteryUrl: string;
  ticketingPlatform: "1iota" | "on-camera-audiences" | "show-site" | "other";
  logoUrl?: string;
  isLotteryOpen: boolean;
  lotteryOpensAt?: string;
  lotteryClosesAt?: string;
  tapeDate?: string;
  lastChecked: string;
  howToApply: string;
}

export interface UserPreferences {
  interests: EventCategory[];
  neighborhoods: string[];
  maxPrice: number | null; // null = any price
  toddlerMode: boolean;
  filmMode: boolean;
  notificationsEnabled: boolean;
  showLotteryAlerts: string[]; // show IDs to alert for
  emailAlerts?: string;
}

export interface PushSubscription {
  id: string;
  subscription: object;
  preferences: string[]; // categories to notify about
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  cached?: boolean;
  lastUpdated?: string;
  error?: string;
}
